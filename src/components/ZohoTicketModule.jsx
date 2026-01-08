import React from 'react';

// Sample data for Zoho tickets. In a real application, you would fetch this data from an API.
const sampleTickets = [
  { id: 'ZT-101', subject: 'Login issue on the main portal', status: 'Open', assignee: 'John Doe' },
  { id: 'ZT-102', subject: 'API integration failing for new customer', status: 'In Progress', assignee: 'Jane Smith' },
  { id: 'ZT-103', subject: 'UI glitch on the dashboard analytics page', status: 'Open', assignee: 'Peter Jones' },
  { id: 'ZT-104', subject: 'Update payment information for account #12345', status: 'Closed', assignee: 'John Doe' },
  { id: 'ZT-105', subject: 'Feature Request: Export to CSV', status: 'On Hold', assignee: 'Jane Smith' },
];

const ZohoTicketModule = () => {
  const ticketItemStyle = {
    borderBottom: '1px solid #eee',
    padding: '12px 0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const statusStyle = (status) => {
    const baseStyle = {
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: 'bold',
    };
    switch (status) {
      case 'Open':
        return { ...baseStyle, backgroundColor: '#e6f7ff', color: '#1890ff' };
      case 'In Progress':
        return { ...baseStyle, backgroundColor: '#fffbe6', color: '#faad14' };
      case 'Closed':
        return { ...baseStyle, backgroundColor: '#f6ffed', color: '#52c41a' };
      case 'On Hold':
        return { ...baseStyle, backgroundColor: '#fafafa', color: '#8c8c8c' };
      default:
        return baseStyle;
    }
  };

  return (
    <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '16px', margin: '16px', fontFamily: 'Arial, sans-serif', backgroundColor: '#fff' }}>
      <h2 style={{ marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '8px', color: '#333' }}>Zoho Tickets</h2>
      <div>
        {sampleTickets.map((ticket, index) => (
          <div key={ticket.id} style={{ ...ticketItemStyle, borderBottom: index === sampleTickets.length - 1 ? 'none' : ticketItemStyle.borderBottom }}>
            <div>
              <div style={{ fontWeight: 'bold', color: '#444' }}>{ticket.subject}</div>
              <div style={{ fontSize: '12px', color: '#777', marginTop: '4px' }}>
                #{ticket.id} - Assigned to {ticket.assignee}
              </div>
            </div>
            <div style={statusStyle(ticket.status)}>
              {ticket.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ZohoTicketModule;