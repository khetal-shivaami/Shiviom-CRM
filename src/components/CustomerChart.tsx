
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Customer, Partner } from '../types';
import { API_ENDPOINTS } from '@/config/api';

interface CustomerChartProps {
  customers: Customer[];
  partners: Partner[];
}

// Define a more specific type for the customer data coming from the API
interface ApiCustomer {
  reseller_name: string;
  customer_company_name: string;
  customer_domainname: string;
  customer_emailid: string;
  [key: string]: any; // Allow other properties
}

interface PartnerData {
  name: string;
  customer_count: number;
}

const CustomerChart = ({ customers, partners }: CustomerChartProps) => {
  const [top10PartnerData, setTop10PartnerData] = useState<PartnerData[]>([]);
  const [allApiCustomers, setAllApiCustomers] = useState<ApiCustomer[]>([]);
  const [selectedReseller, setSelectedReseller] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchTopPartners = async () => {
      try {
        // Assuming the API returns data in the format needed for the chart.
        // You may need to process the data returned from the API.
        const response = await fetch(API_ENDPOINTS.GET_RESELLER_CUSTOEMRS_LIST_ONCRM, {
          method: 'POST',
        });
       if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (!result.success || !result.data || !result.data.data_result) {
          throw new Error('Invalid API response structure for customers.');
        }

        const apiCustomers: ApiCustomer[] = result.data.data_result;
        setAllApiCustomers(apiCustomers); // Store all customers

        // Group customers by reseller and count them
        const resellerCustomerCount = apiCustomers.reduce((acc, customer) => {
          const resellerName = customer.reseller_name;
          if (resellerName) {
            if (!acc[resellerName]) {
              acc[resellerName] = { name: resellerName, customer_count: 0 };
            }
            acc[resellerName].customer_count += 1;
          }
          return acc;
        }, {} as Record<string, PartnerData>);

        // Convert to array, sort by customer count, and take the top 10
        const sortedPartners = Object.values(resellerCustomerCount)
          .sort((a, b) => b.customer_count - a.customer_count)
          .slice(0, 10);

        console.log(sortedPartners);
        setTop10PartnerData(sortedPartners);

      } catch (error) {
        console.error("Failed to fetch top partner data:", error);
        // Optionally, set some error state to display in the UI
      }
    };

    fetchTopPartners();
  }, []); // Empty dependency array to run only on mount

  const handleResellerClick = (resellerName: string) => {
    setSelectedReseller(resellerName);
    setIsModalOpen(true);
  };

  const statusData = useMemo(() => [
    { name: 'Active', value: customers.filter(c => c.status === 'active').length, color: '#10b981' },
    { name: 'Pending', value: customers.filter(c => c.status === 'pending').length, color: '#f59e0b' },
    { name: 'Inactive', value: customers.filter(c => c.status === 'inactive').length, color: '#ef4444' },
  ], [customers]);

  return (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Partners by Customer Count</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={top10PartnerData} layout="vertical" margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={120}
                tick={{ fontSize: 12 }}
                label={{ value: 'Reseller Name', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
              />
              <Tooltip formatter={(value) => [`${value} customers`, 'Customers']} />
              <Legend />
              <Bar
                dataKey="customer_count"
                fill="#3b82f6"
                name="Count of Customers"
                barSize={20}
                onClick={(data) => handleResellerClick(data.name)}
                style={{ cursor: 'pointer' }} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Customer Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Customers of {selectedReseller}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            {allApiCustomers
              .filter(c => c.reseller_name === selectedReseller)
              .map((customer, index) => (
                <div key={index} className="p-3 border rounded-md">
                  <p className="font-semibold">{customer.customer_company_name}</p>
                  <p className="text-sm text-gray-500">{customer.customer_domainname}</p>
                  <p className="text-sm text-gray-500">{customer.customer_emailid}</p>
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>
     </div>
  );
};

export default CustomerChart;
