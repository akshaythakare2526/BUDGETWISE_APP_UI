import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MailComposer from 'expo-mail-composer';
import { offlineManager } from './OfflineManager';

export interface ExportOptions {
  format: 'csv' | 'json';
  dateRange: 'all' | 'last30' | 'last90' | 'last365' | 'custom';
  startDate?: string;
  endDate?: string;
  includeExpenses: boolean;
  includeDeposits: boolean;
}

export class ExportService {
  private static instance: ExportService;

  static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  async exportData(options: ExportOptions): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      console.log('🔄 Starting data export...', options);
      
      // Get data from offline manager
      const data = await offlineManager.getAllTransactions();
      
      // Filter data based on options
      const filteredData = this.filterDataByOptions(data, options);
      
      // Generate file content
      const fileContent = options.format === 'csv' 
        ? this.generateCSV(filteredData, options)
        : this.generateJSON(filteredData, options);
      
      // Create file
      const fileName = this.generateFileName(options);
      const filePath = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(filePath, fileContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      console.log('✅ Export file created:', filePath);
      return { success: true, filePath };
      
    } catch (error) {
      console.error('❌ Export error:', error);
      return { success: false, error: 'Failed to export data' };
    }
  }

  private filterDataByOptions(data: { expenses: any[]; deposits: any[] }, options: ExportOptions) {
    let expenses = options.includeExpenses ? data.expenses : [];
    let deposits = options.includeDeposits ? data.deposits : [];

    // Filter by date range
    if (options.dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (options.dateRange) {
        case 'last30':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'last90':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case 'last365':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        case 'custom':
          startDate = options.startDate ? new Date(options.startDate) : new Date(0);
          break;
        default:
          startDate = new Date(0);
      }

      const endDate = options.dateRange === 'custom' && options.endDate 
        ? new Date(options.endDate) 
        : now;

      expenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.createdAt || expense.dateTime || expense.date);
        return expenseDate >= startDate && expenseDate <= endDate;
      });

      deposits = deposits.filter(deposit => {
        const depositDate = new Date(deposit.createdAt || deposit.dateTime || deposit.date);
        return depositDate >= startDate && depositDate <= endDate;
      });
    }

    return { expenses, deposits };
  }

  private generateCSV(data: { expenses: any[]; deposits: any[] }, options: ExportOptions): string {
    let csvContent = '';

    if (options.includeExpenses && data.expenses.length > 0) {
      csvContent += 'EXPENSES\n';
      csvContent += 'Date,Title,Amount,Category,Description\n';
      
      data.expenses.forEach(expense => {
        const date = new Date(expense.createdAt || expense.dateTime || expense.date).toLocaleDateString();
        const title = (expense.tittle || expense.title || '').replace(/,/g, ';');
        const amount = expense.amount || 0;
        const category = this.getCategoryName(expense.expenseCategoryID || expense.categoryId);
        const description = (expense.description || '').replace(/,/g, ';');
        
        csvContent += `${date},"${title}",${amount},"${category}","${description}"\n`;
      });
      csvContent += '\n';
    }

    if (options.includeDeposits && data.deposits.length > 0) {
      csvContent += 'DEPOSITS\n';
      csvContent += 'Date,Title,Amount,Description\n';
      
      data.deposits.forEach(deposit => {
        const date = new Date(deposit.createdAt || deposit.dateTime || deposit.date).toLocaleDateString();
        const title = (deposit.tittle || deposit.title || '').replace(/,/g, ';');
        const amount = deposit.amount || 0;
        const description = (deposit.description || '').replace(/,/g, ';');
        
        csvContent += `${date},"${title}",${amount},"${description}"\n`;
      });
    }

    // Add summary
    const totalExpenses = data.expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const totalDeposits = data.deposits.reduce((sum, dep) => sum + (dep.amount || 0), 0);
    const balance = totalDeposits - totalExpenses;

    csvContent += '\nSUMMARY\n';
    csvContent += `Total Expenses,${totalExpenses}\n`;
    csvContent += `Total Deposits,${totalDeposits}\n`;
    csvContent += `Balance,${balance}\n`;
    csvContent += `Export Date,${new Date().toLocaleDateString()}\n`;

    return csvContent;
  }

  private generateJSON(data: { expenses: any[]; deposits: any[] }, options: ExportOptions): string {
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        format: 'json',
        dateRange: options.dateRange,
        includeExpenses: options.includeExpenses,
        includeDeposits: options.includeDeposits,
        totalExpenses: data.expenses.length,
        totalDeposits: data.deposits.length,
      },
      summary: {
        totalExpenseAmount: data.expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0),
        totalDepositAmount: data.deposits.reduce((sum, dep) => sum + (dep.amount || 0), 0),
        balance: data.deposits.reduce((sum, dep) => sum + (dep.amount || 0), 0) - 
                data.expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0),
      },
      data: {
        expenses: data.expenses.map(expense => ({
          id: expense.expenseId || expense.id,
          date: expense.createdAt || expense.dateTime || expense.date,
          title: expense.tittle || expense.title,
          amount: expense.amount,
          category: this.getCategoryName(expense.expenseCategoryID || expense.categoryId),
          categoryId: expense.expenseCategoryID || expense.categoryId,
          description: expense.description,
        })),
        deposits: data.deposits.map(deposit => ({
          id: deposit.depositId || deposit.id,
          date: deposit.createdAt || deposit.dateTime || deposit.date,
          title: deposit.tittle || deposit.title,
          amount: deposit.amount,
          description: deposit.description,
        })),
      },
    };

    return JSON.stringify(exportData, null, 2);
  }

  private getCategoryName(categoryId: number): string {
    const categories: { [key: number]: string } = {
      1: 'Food',
      2: 'Hospital',
      3: 'Investment',
      4: 'Rent',
      5: 'Bill',
      6: 'Education',
      7: 'Transport',
      8: 'Entertainment',
      9: 'Utilities',
      10: 'Grocery',
      11: 'Travel',
      12: 'Insurance',
      13: 'Shopping',
      14: 'Loan',
      15: 'Miscellaneous',
      16: 'Credit Card Bill',
    };

    return categories[categoryId] || 'Unknown';
  }

  private generateFileName(options: ExportOptions): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const format = options.format.toUpperCase();
    return `BudgetWise_Export_${timestamp}.${options.format}`;
  }

  async shareFile(filePath: string): Promise<{ success: boolean; error?: string }> {
    try {
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        return { success: false, error: 'Sharing not available on this device' };
      }

      // Get the file extension and set appropriate MIME type
      const isCSV = filePath.endsWith('.csv');
      const mimeType = isCSV ? 'text/csv' : 'application/json';
      
      await Sharing.shareAsync(filePath, {
        mimeType,
        dialogTitle: 'Save BudgetWise Export',
        UTI: isCSV ? 'public.comma-separated-values-text' : 'public.json',
      });

      console.log('✅ File shared successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Share error:', error);
      return { success: false, error: 'Failed to share file' };
    }
  }

  async emailFile(filePath: string, recipientEmail?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const canEmail = await MailComposer.isAvailableAsync();
      if (!canEmail) {
        return { success: false, error: 'Email not available on this device' };
      }

      const fileName = filePath.split('/').pop() || 'export.csv';
      
      await MailComposer.composeAsync({
        recipients: recipientEmail ? [recipientEmail] : [],
        subject: 'BudgetWise Data Export',
        body: `Hi,\n\nHere's your BudgetWise data export.\n\nFile: ${fileName}\nExport Date: ${new Date().toLocaleDateString()}\n\nBest regards,\nBudgetWise App`,
        attachments: [filePath],
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Email error:', error);
      return { success: false, error: 'Failed to send email' };
    }
  }
}

export const exportService = ExportService.getInstance();
