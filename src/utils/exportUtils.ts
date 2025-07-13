
export const exportToCSV = (data: any[], filename: string) => {
  if (!data.length) return;
  
  // Get headers from the first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    headers.join(','), // Header row
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle values that contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',')
    )
  ].join('\n');
  
  // Create and download the file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const formatDataForExport = (data: any[], type: 'events' | 'locations' | 'instructors' | 'techniques' | 'analytics') => {
  switch (type) {
    case 'events':
      return data.map(event => ({
        Title: event.title,
        Description: event.description,
        'Start Date': event.start_date,
        'End Date': event.end_date || '',
        'Price (cents)': event.price_cents || 0,
        Currency: event.currency || 'usd',
        Published: event.is_published ? 'Yes' : 'No',
        'Created At': new Date(event.created_at).toLocaleDateString(),
      }));
    
    case 'locations':
      return data.map(location => ({
        Name: location.name,
        Address: location.address || '',
        'Virtual URL': location.virtual_url || '',
        'Created At': new Date(location.created_at).toLocaleDateString(),
      }));
    
    case 'instructors':
      return data.map(instructor => ({
        Name: instructor.name,
        Bio: instructor.bio || '',
        'Profile Image': instructor.profile_image_url || '',
        'Created At': new Date(instructor.created_at).toLocaleDateString(),
      }));
    
    case 'techniques':
      return data.map(technique => ({
        Name: technique.name,
        Slug: technique.slug,
        Summary: technique.summary || '',
        'Difficulty Level': technique.difficulty_level || '',
        'Reading Time': technique.estimated_reading_time || 0,
        Published: technique.is_published ? 'Yes' : 'No',
        'View Count': technique.view_count || 0,
        Category: technique.category || '',
        'Created At': new Date(technique.created_at).toLocaleDateString(),
      }));
    
    case 'analytics':
      return data.map(item => ({
        Query: item.query,
        'Results Count': item.results_count,
        'User ID': item.user_id || '',
        'Session ID': item.session_id || '',
        'IP Address': item.ip_address || '',
        'Created At': new Date(item.created_at).toLocaleDateString(),
      }));
    
    default:
      return data;
  }
};
