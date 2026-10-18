import { promises as fs } from 'fs';
import path from 'path';
import type {
  ContactMessage,
  NewsletterEntry,
  Order,
  Review,
} from './types';

const DATA_DIR = path.join(process.cwd(), 'data');

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    /* ignore */
  }
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  await ensureDir();
  const p = path.join(DATA_DIR, file);
  try {
    const txt = await fs.readFile(p, 'utf8');
    return JSON.parse(txt) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(file: string, data: T): Promise<void> {
  await ensureDir();
  const p = path.join(DATA_DIR, file);
  await fs.writeFile(p, JSON.stringify(data, null, 2), 'utf8');
}

export async function listOrders(): Promise<Order[]> {
  return readJson<Order[]>('orders.json', []);
}

export async function addOrder(order: Order): Promise<void> {
  const items = await listOrders();
  items.unshift(order);
  await writeJson('orders.json', items);
}

export async function listNewsletter(): Promise<NewsletterEntry[]> {
  return readJson<NewsletterEntry[]>('newsletter.json', []);
}

export async function addNewsletter(entry: NewsletterEntry): Promise<boolean> {
  const items = await listNewsletter();
  if (items.some((e) => e.email.toLowerCase() === entry.email.toLowerCase())) {
    return false;
  }
  items.unshift(entry);
  await writeJson('newsletter.json', items);
  return true;
}

export async function listContacts(): Promise<ContactMessage[]> {
  return readJson<ContactMessage[]>('contacts.json', []);
}

export async function addContact(msg: ContactMessage): Promise<void> {
  const items = await listContacts();
  items.unshift(msg);
  await writeJson('contacts.json', items);
}

const SEED_REVIEWS: Review[] = [
  {
    id: 'r1',
    name: 'Dilnoza M.',
    rating: 5,
    text: "Hijob do'konidan olgan ro'mollarim juda sifatli chiqdi. Ranglari yorqin, matolari yumshoq. Albatta yana buyurtma beraman!",
    createdAt: '2024-11-05T00:00:00Z',
  },
  {
    id: 'r2',
    name: 'Malika K.',
    rating: 5,
    text: 'Yetkazib berish tez va qulay. Mahsulot rasmdagidek chiqdi. Narxi ham juda qulay. Tavsiya qilaman!',
    createdAt: '2024-10-18T00:00:00Z',
  },
  {
    id: 'r3',
    name: 'Zulfiya A.',
    rating: 5,
    text: "AI maslahatchi orqali o'zimga mos rangni topdim. Juda qulay xizmat. Mijozlarga munosabat a'lo darajada!",
    createdAt: '2024-11-22T00:00:00Z',
  },
];

export async function listReviews(productId?: string): Promise<Review[]> {
  const stored = await readJson<Review[]>('reviews.json', []);
  const all = [...SEED_REVIEWS, ...stored];
  if (productId) {
    return all.filter((r) => r.productId === productId);
  }
  return all;
}

export async function addReview(r: Review): Promise<void> {
  const items = await readJson<Review[]>('reviews.json', []);
  items.unshift(r);
  await writeJson('reviews.json', items);
}

export function makeId(prefix = ''): string {
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 8);
  return `${prefix}${t}${r}`;
}
