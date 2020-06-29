import path from 'path';
import csvtojson from 'csvtojson';
import fs from 'fs';
import Transaction from '../models/Transaction';
import CreateTransactionService from './CreateTransactionService';
import uploadConfig from '../config/upload';
import AppError from '../errors/AppError';

interface Request {
  filename: string;
}

interface TransactionDTO {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}


class ImportTransactionsService {
  async execute({ filename }: Request): Promise<void> {
    const createTransaction = new CreateTransactionService();

    const transactionFilePath = path.join(uploadConfig.directory, filename);
    const transactionFileExists = await fs.promises.stat(transactionFilePath);

    if (!transactionFileExists) {
      throw new AppError('File not found', 404);
    }

    const transactions: TransactionDTO[] = await csvtojson().fromFile(
      transactionFilePath,
    );

    for (const transactioItem of transactions) {
      await createTransaction.execute({
        title: transactioItem.title,
        type: transactioItem.type,
        value: transactioItem.value,
        category: transactioItem.category,
      });
    }

    // Remover arquivo de upload
    await fs.promises.unlink(transactionFilePath);

  }
}

export default ImportTransactionsService;
