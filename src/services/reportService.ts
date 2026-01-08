import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { UserOptions } from 'jspdf-autotable';
import { Customer, Partner, Product, User, Task } from '../types';
import { supabase } from '@/integrations/supabase/client';

export interface ReportConfig {
  type: string;
  format: 'csv' | 'excel' | 'pdf';
  dateRange?: string;
  fields?: string[];
  filters?: Record<string, string>;
}

export interface ReportData {
  customers?: Customer[];
  partners?: Partner[];
  products?: Product[];
  users?: User[];
  tasks?: Task[];
}

// Extend jsPDF with the autoTable plugin
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: UserOptions) => jsPDF;
}

class ReportService {
  generateReport(config: ReportConfig, data: ReportData, userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        switch (config.format) {
          case 'csv':
            this.generateCSV(config, data);
            break;
          case 'excel':
            this.generateExcel(config, data);
            break;
          case 'pdf':
            return this.generatePDF(config, data);
            break;
          default:
            throw new Error('Unsupported format');
        }
        // Log the report generation after it's created
        this.logReportGeneration(config.type, config.format, userId).catch(err => {
          console.error("Failed to log report generation:", err); // Log error but don't block user
        });
        // Resolve is handled by the PDF generation return for that case
      } catch (error) {
        reject(error);
      }
    });
  }

  private async logReportGeneration(reportId: string, format: string, userId: string) {
    const { error } = await supabase
      .from('report_logs')
      .insert({
        report_id: reportId,
        format: format,
        generated_by: userId
      });
    if (error) throw error;
  }

  private generateCSV(config: ReportConfig, data: ReportData) {
    const processedData = this.processDataForReport(config, data);
    const worksheet = XLSX.utils.json_to_sheet(processedData);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const filename = this.generateFilename(config, 'csv');
    saveAs(blob, filename);
  }

  private generateExcel(config: ReportConfig, data: ReportData) {
    const processedData = this.processDataForReport(config, data);
    const workbook = XLSX.utils.book_new();
    
    // Main data sheet
    const worksheet = XLSX.utils.json_to_sheet(processedData);
    XLSX.utils.book_append_sheet(workbook, worksheet, this.getSheetName(config.type));
    
    // Summary sheet for analytics
    if (config.type === 'tasks' && data.tasks) {
      const summary = this.generateTaskSummary(data.tasks);
      const summarySheet = XLSX.utils.json_to_sheet(summary);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    }
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const filename = this.generateFilename(config, 'xlsx');
    saveAs(blob, filename);
  }

  private generatePDF(config: ReportConfig, data: ReportData): Promise<void> {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const processedData = this.processDataForReport(config, data);

    doc.setFontSize(20);
    doc.text(this.getReportTitle(config.type), 20, 20);

    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35);

    // Use autoTable for task-performance report
    if (config.type === 'task-performance' && data.tasks && data.users) {
      const userMap = new Map(data.users.map(user => [user.id, user.name || user.email]));

      const head = [["Title", "Status", "Priority", "Due Date", "Created By", "Assigned To"]];
      const body = data.tasks.map(task => [
        task.title,
        task.status,
        task.priority,
        task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A',
        userMap.get(task.assignedBy) || task.assignedBy || 'Unknown',
        userMap.get(task.assignedTo) || task.assignedTo || 'Unassigned'
      ]);

      doc.autoTable({
        head: head,
        body: body,
        startY: 45,
        headStyles: { fillColor: [22, 160, 133] }, // Theme color
        styles: { fontSize: 8 },
      });
    } else {
      // Fallback to original simplified PDF generation for other reports
      doc.text(`Date Range: ${config.dateRange || 'All time'}`, 20, 45);
      let yPosition = 60;
      doc.setFontSize(14);
      doc.text('Summary:', 20, yPosition);
      yPosition += 15;
      doc.setFontSize(10);
      doc.text(`Total Records: ${processedData.length}`, 20, yPosition);
      yPosition += 10;

      if (processedData.length > 0) {
        const headers = Object.keys(processedData[0]);
        const body = processedData.map(row => headers.map(header => String(row[header] || '')));
        doc.autoTable({
          head: [headers],
          body: body,
          startY: yPosition,
        });
      }
    }
    
    return new Promise((resolve) => {
      doc.output('dataurlnewwindow');
      resolve();
    });
  }

  private processDataForReport(config: ReportConfig, data: ReportData): any[] {
    let sourceData: any[] = [];
    
    try {
      switch (config.type) {
        case 'customers':
        case 'customer-summary':
        case 'customer-engagement':
          sourceData = this.processCustomerData(data.customers || [], config);
          break;
        case 'partners':
        case 'partner-performance':
        case 'partner-onboarding':
          sourceData = this.processPartnerData(data.partners || [], config);
          break;
        case 'products':
        case 'product-adoption':
        case 'product-performance':
          sourceData = this.processProductData(data.products || [], config);
          break;
        case 'tasks':
        case 'task-performance':
        case 'operational-reports':
          sourceData = this.processTaskData(data.tasks || [], config);
          break;
        case 'users':
        case 'user-activity':
          sourceData = this.processUserData(data.users || [], config);
          break;
        case 'productivity':
        case 'employee-productivity':
          sourceData = this.processProductivityData(data.tasks || [], config);
          break;
        case 'business-intelligence':
        case 'revenue-analysis':
          sourceData = this.processBusinessIntelligenceData(data, config);
          break;
        case 'combined':
        case 'executive-summary':
          sourceData = this.processCombinedData(data, config);
          break;
        default:
          console.warn(`Unknown report type: ${config.type}, using generic processing`);
          sourceData = this.processGenericData(data, config);
      }
      
      console.log(`Processed ${sourceData.length} records for report type: ${config.type}`);
      
      if (sourceData.length === 0) {
        console.warn(`No data found for report type: ${config.type}`);
      }
      
    } catch (error) {
      console.error(`Error processing data for report type ${config.type}:`, error);
      sourceData = [];
    }
    
    return this.applyFilters(sourceData, config.filters || {});
  }

  private processCustomerData(customers: Customer[], config: ReportConfig): any[] {
    return customers.map(customer => ({
      Name: customer.name,
      Email: customer.email,
      Company: customer.company,
      Status: customer.status,
      Value: `₹${customer.value.toLocaleString('en-IN')}`,
      Zone: customer.zone || 'N/A',
      Process: customer.process,
      'Created Date': new Date(customer.createdAt).toLocaleDateString(),
      'Partner ID': customer.partnerId || 'N/A',
      'Product Count': customer.productIds?.length || 0,
      'Assigned Users': customer.assignedUserIds?.length || 0
    }));
  }

  private processPartnerData(partners: Partner[], config: ReportConfig): any[] {
    return partners.map(partner => ({
      Name: partner.name,
      Email: partner.email,
      Company: partner.company,
      Status: partner.status,
      Specialization: partner.specialization || 'N/A',
      'Onboarding Stage': partner.onboarding?.currentStage || 'N/A',
      'Agreement Signed': partner.agreementSigned ? 'Yes' : 'No',
      Zone: partner.zone || 'N/A',
      'Created Date': new Date(partner.createdAt).toLocaleDateString(),
      'Product Types': partner.productTypes?.join(', ') || 'N/A',
      'Assigned Users': partner.assignedUserIds?.length || 0
    }));
  }

  private processProductData(products: Product[], config: ReportConfig): any[] {
    return products.map(product => ({
      Name: product.name,
      Category: product.category,
      Status: product.status,
      Website: product.website,
      Description: product.description || 'N/A',
      'Created Date': new Date(product.createdAt).toLocaleDateString(),
      'Plan Count': Array.isArray(product.plans) ? product.plans.length : 0
    }));
  }

  private processTaskData(tasks: Task[], config: ReportConfig): any[] {
    return tasks.map(task => ({
      Title: task.title,
      Description: task.description || 'N/A',
      Type: task.type,
      Priority: task.priority,
      Status: task.status,
      'Assigned To ID': task.assignedTo || 'Unassigned',
      'Customer ID': task.customerId || 'N/A',
      'Partner ID': task.partnerId || 'N/A',
      'Due Date': task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A',
      'Created Date': new Date(task.createdAt).toLocaleDateString(),
      'Estimated Hours': task.estimatedHours || 0,
      'Actual Hours': task.actualHours || 0,
      Tags: task.tags?.join(', ') || 'N/A'
    }));
  }

  private processUserData(users: User[], config: ReportConfig): any[] {
    return users.map(user => ({
      Name: user.name,
      Email: user.email,
      Role: user.role,
      Department: user.department || 'N/A',
      Status: user.status,
      Phone: user.phone || 'N/A',
      'Last Login': user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never',
      'Created Date': new Date(user.createdAt).toLocaleDateString()
    }));
  }

  private processProductivityData(tasks: Task[], config: ReportConfig): any[] {
    const userStats = new Map();
    
    tasks.forEach(task => {
      const userId = task.assignedTo || 'unassigned';
      if (!userStats.has(userId)) {
        userStats.set(userId, {
          userId,
          totalTasks: 0,
          completedTasks: 0,
          overdueTasks: 0,
          estimatedHours: 0,
          actualHours: 0
        });
      }
      
      const stats = userStats.get(userId);
      stats.totalTasks++;
      if (task.status === 'completed') stats.completedTasks++;
      if (task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed') {
        stats.overdueTasks++;
      }
      stats.estimatedHours += task.estimatedHours || 0;
      stats.actualHours += task.actualHours || 0;
    });
    
    return Array.from(userStats.values()).map(stats => ({
      'User ID': stats.userId,
      'Total Tasks': stats.totalTasks,
      'Completed Tasks': stats.completedTasks,
      'Completion Rate': stats.totalTasks > 0 ? `${((stats.completedTasks / stats.totalTasks) * 100).toFixed(1)}%` : '0%',
      'Overdue Tasks': stats.overdueTasks,
      'Estimated Hours': stats.estimatedHours,
      'Actual Hours': stats.actualHours,
      'Efficiency': stats.estimatedHours > 0 ? `${((stats.estimatedHours / stats.actualHours) * 100).toFixed(1)}%` : 'N/A'
    }));
  }

  private processBusinessIntelligenceData(data: ReportData, config: ReportConfig): any[] {
    const insights = [];
    
    // Revenue analysis
    const totalRevenue = (data.customers || []).reduce((sum, c) => sum + c.value, 0);
    insights.push({
      Metric: 'Total Revenue Pipeline',
      Value: `₹${totalRevenue.toLocaleString('en-IN')}`,
      Type: 'Revenue'
    });
    
    // Customer metrics
    const activeCustomers = (data.customers || []).filter(c => c.status === 'active').length;
    insights.push({
      Metric: 'Active Customers',
      Value: activeCustomers,
      Type: 'Customer'
    });
    
    // Task completion
    const totalTasks = (data.tasks || []).length;
    const completedTasks = (data.tasks || []).filter(t => t.status === 'completed').length;
    insights.push({
      Metric: 'Task Completion Rate',
      Value: totalTasks > 0 ? `${((completedTasks / totalTasks) * 100).toFixed(1)}%` : '0%',
      Type: 'Performance'
    });
    
    return insights;
  }

  private processCombinedData(data: ReportData, config: ReportConfig): any[] {
    const summary = [];
    
    summary.push({
      Category: 'Customers',
      'Total Count': (data.customers || []).length,
      'Active Count': (data.customers || []).filter(c => c.status === 'active').length,
      'Total Value': `₹${(data.customers || []).reduce((sum, c) => sum + c.value, 0).toLocaleString('en-IN')}`
    });
    
    summary.push({
      Category: 'Partners',
      'Total Count': (data.partners || []).length,
      'Active Count': (data.partners || []).filter(p => p.status === 'active').length,
      'Total Value': 'N/A'
    });
    
    summary.push({
      Category: 'Products',
      'Total Count': (data.products || []).length,
      'Active Count': (data.products || []).filter(p => p.status === 'active').length,
      'Total Value': 'N/A'
    });
    
    summary.push({
      Category: 'Tasks',
      'Total Count': (data.tasks || []).length,
      'Active Count': (data.tasks || []).filter(t => t.status === 'completed').length,
      'Total Value': 'N/A'
    });
    
    return summary;
  }

  private processGenericData(data: ReportData, config: ReportConfig): any[] {
    // Fallback for any unhandled report types
    const allData = [
      ...(data.customers || []),
      ...(data.partners || []),
      ...(data.products || []),
      ...(data.tasks || [])
    ];
    
    return allData.map((item, index) => ({
      Index: index + 1,
      Type: 'name' in item ? 'Customer/Partner/Product' : 'Task',
      Name: 'name' in item ? item.name : 'title' in item ? item.title : 'N/A',
      Status: item.status || 'N/A',
      'Created Date': new Date(item.createdAt).toLocaleDateString()
    }));
  }

  private applyFilters(data: any[], filters: Record<string, string>): any[] {
    let filteredData = [...data];
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        filteredData = filteredData.filter(item => {
          const itemValue = item[key] || item[this.capitalizeFirstLetter(key)];
          return String(itemValue).toLowerCase().includes(value.toLowerCase());
        });
      }
    });
    
    return filteredData;
  }

  private generateTaskSummary(tasks: Task[]): any[] {
    const statusCounts = tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const priorityCounts = tasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const summary = [];
    
    // Status summary
    Object.entries(statusCounts).forEach(([status, count]) => {
      summary.push({
        Type: 'Status',
        Category: status,
        Count: count,
        Percentage: `${((count / tasks.length) * 100).toFixed(1)}%`
      });
    });
    
    // Priority summary
    Object.entries(priorityCounts).forEach(([priority, count]) => {
      summary.push({
        Type: 'Priority',
        Category: priority,
        Count: count,
        Percentage: `${((count / tasks.length) * 100).toFixed(1)}%`
      });
    });
    
    return summary;
  }

  private generateFilename(config: ReportConfig, extension: string): string {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const reportName = config.type.replace(/[^a-zA-Z0-9]/g, '_');
    return `${reportName}_${timestamp}.${extension}`;
  }

  private getReportTitle(type: string): string {
    const titles: Record<string, string> = {
      'customers': 'Customer Report',
      'partners': 'Partner Report',
      'products': 'Product Report',
      'tasks': 'Task Report',
      'users': 'User Report',
      'productivity': 'Productivity Analytics',
      'business-intelligence': 'Business Intelligence Report',
      'combined': 'Executive Summary Report'
    };
    return titles[type] || 'Business Report';
  }

  private getSheetName(type: string): string {
    const names: Record<string, string> = {
      'customers': 'Customers',
      'partners': 'Partners',
      'products': 'Products',
      'tasks': 'Tasks',
      'users': 'Users',
      'productivity': 'Productivity',
      'business-intelligence': 'BI Analysis',
      'combined': 'Summary'
    };
    return names[type] || 'Data';
  }

  private capitalizeFirstLetter(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
}

export const reportService = new ReportService();