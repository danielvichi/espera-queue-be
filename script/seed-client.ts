import * as fs from 'fs';
import { join } from 'path';

const filePath = join(__dirname, './data/client-sample.json');
const rawData = fs.readFileSync(filePath, 'utf-8');

interface ClientData {
  clients: Array<object>;
  queue_users: Array<object>;
}
const data = JSON.parse(rawData) as ClientData;

const clients = data['clients'];
const queue_users = data['queue_users'];

if (
  !clients ||
  !queue_users ||
  !Array.isArray(clients) ||
  !Array.isArray(queue_users)
) {
  throw new Error('Invalid or wrong format data in JSON file.');
}

export function seed() {
  console.log('Clients to be seeded:', clients);
  console.log('Queue Users to be seeded:', queue_users);
}

seed();
