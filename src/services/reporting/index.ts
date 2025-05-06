import { ReportService } from './reportService';

/**
 * Command-line interface for generating financial reports
 */
async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const options: { [key: string]: string } = {};
    
    // Extract options
    args.forEach(arg => {
      if (arg.startsWith('--')) {
        const [key, value] = arg.slice(2).split('=');
        options[key] = value || 'true';
      }
    });
    
    // Create reporting service
    const useSlack = options.notify === 'true';
    const reportService = new ReportService(useSlack);
    
    // Check which report type to generate
    const reportType = options.type || 'monthly-revenue';
    
    switch (reportType) {
      case 'monthly-revenue': {
        const month = options.month || 'current';
        console.log(`Generating monthly revenue report for ${month}`);
        const result = await reportService.generateMonthlyRevenueReport(month);
        console.log(`Report generated: ${result.url}`);
        break;
      }
      
      case 'quarterly-sales': {
        const quarter = options.quarter || 'current';
        console.log(`Generating quarterly sales report for ${quarter}`);
        const result = await reportService.generateQuarterlySalesReport(quarter);
        console.log(`Report generated: ${result.url}`);
        break;
      }
      
      case 'annual-summary': {
        const year = options.year || 'current';
        console.log(`Generating annual summary for ${year}`);
        const result = await reportService.generateAnnualSummary(year);
        console.log(`Report generated: ${result.url}`);
        break;
      }
      
      default:
        console.error(`Unknown report type: ${reportType}`);
        console.log('Available report types:');
        console.log('  monthly-revenue: Revenue breakdown by product category');
        console.log('  quarterly-sales: Detailed sales report with trends');
        console.log('  annual-summary: Year-to-date financial summary');
        process.exit(1);
    }
  } catch (error) {
    console.error('Error generating report:', error);
    process.exit(1);
  }
}

// Run the main function if this file is executed directly
if (require.main === module) {
  main();
}

export { ReportService }; 