import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import { Customer, Partner, Product, User, Task } from '../types';

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

class ReportService {
  generateReport(config: ReportConfig, data: ReportData): Promise<void> {
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
            this.generatePDF(config, data);
            break;
          default:
            throw new Error('Unsupported format');
        }
        resolve();
      } catch (error) {
        reject(error);
      }
    });
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

  private generatePDF(config: ReportConfig, data: ReportData) {
    const doc = new jsPDF();
    const processedData = this.processDataForReport(config, data);
    
    // Header
    doc.setFontSize(20);
    doc.text(this.getReportTitle(config.type), 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 35);
    doc.text(`Date Range: ${config.dateRange || 'All time'}`, 20, 45);
    
    // Summary statistics
    let yPosition = 60;
    doc.setFontSize(14);
    doc.text('Summary:', 20, yPosition);
    yPosition += 15;
    
    doc.setFontSize(10);
    doc.text(`Total Records: ${processedData.length}`, 20, yPosition);
    yPosition += 10;
    
    // Add type-specific summary
    if (config.type === 'tasks' && data.tasks) {
      const completed = data.tasks.filter(t => t.status === 'completed').length;
      const completion = data.tasks.length > 0 ? ((completed / data.tasks.length) * 100).toFixed(1) : '0';
      doc.text(`Completion Rate: ${completion}%`, 20, yPosition);
      yPosition += 10;
    }
    
    // Table data (simplified for PDF)
    yPosition += 10;
    doc.setFontSize(12);
    doc.text('Data:', 20, yPosition);
    yPosition += 15;
    
    // Add table headers and first few rows
    doc.setFontSize(8);
    const headers = Object.keys(processedData[0] || {});
    const maxRows = Math.min(processedData.length, 20); // Limit for PDF
    
    for (let i = 0; i < maxRows; i++) {
      const row = processedData[i];
      let xPosition = 20;
      headers.forEach((header, index) => {
        if (index < 4) { // Limit columns for PDF width
          const value = String(row[header] || '').substring(0, 15);
          doc.text(value, xPosition, yPosition);
          xPosition += 40;
        }
      });
      yPosition += 8;
      
      if (yPosition > 280) { // Page break
        doc.addPage();
        yPosition = 20;
      }
    }
    
    if (processedData.length > 20) {
      yPosition += 10;
      doc.text(`... and ${processedData.length - 20} more records`, 20, yPosition);
    }
    
    const filename = this.generateFilename(config, 'pdf');
    doc.save(filename);
  }

  private processDataForReport(config: ReportConfig, data: ReportData): any[] {
    let sourceData: any[] = [];
    
    switch (config.type) {
      case 'customers':
      case 'customer-summary':
        sourceData = this.processCustomerData(data.customers || [], config);
        break;
      case 'partners':
      case 'partner-performance':
        sourceData = this.processPartnerData(data.partners || [], config);
        break;
      case 'products':
      case 'product-adoption':
        sourceData = this.processProductData(data.products || [], config);
        break;
      case 'tasks':
      case 'task-performance':
        sourceData = this.processTaskData(data.tasks || [], config);
        break;
      case 'users':
        sourceData = this.processUserData(data.users || [], config);
        break;
      case 'productivity':
        sourceData = this.processProductivityData(data.tasks || [], config);
        break;
      case 'business-intelligence':
        sourceData = this.processBusinessIntelligenceData(data, config);
        break;
      case 'combined':
        sourceData = this.processCombinedData(data, config);
        break;
      default:
        sourceData = this.processGenericData(data, config);
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
      'Assigned To': task.assignedTo || 'Unassigned',
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