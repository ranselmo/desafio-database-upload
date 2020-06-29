import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const categoryRepository = getRepository(Category);
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    if (type === 'outcome') {
      const { total } = await transactionsRepository.getBalance();

      if (total < value) {
        throw new AppError('No balance to include new outcome', 400);
      }
    }

    const checkCategoryExists = await categoryRepository.findOne({
      where: { title: category },
    });

    let categoryId;

    // Nao existe categoria precisa criar
    if (!checkCategoryExists) {
      const categoryNew = categoryRepository.create({
        title: category,
      });

      // Salva no banco de dados
      await categoryRepository.save(categoryNew);

      categoryId = categoryNew.id;
    } else {
      categoryId = checkCategoryExists.id;
    }

    // Salva objeto na memoria
    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id: categoryId,
    });

    // Salva no banco de dados
    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
