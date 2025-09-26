interface Admin {
  name: string;
  email: string;
  phone: string;
}

interface Queue {
  name: string;
  color: string;
}

interface Unity {
  name: string;
  address: string;
  phone: string;
  email: string;
  admin: Array<Admin>;
  queue: Array<string>;
}

interface ClientData {
  name: string;
  cnpj?: string;
  address: string;
  phone: string;
  email: string;
  unity: Array<Unity>;
}

interface QueueUser {
  name: string;
  email: string;
  phone: string;
}

interface ClientSample {
  clients: Array<ClientData>;
  queue_users: Array<QueueUser>;
}

export const clientData: ClientData;
