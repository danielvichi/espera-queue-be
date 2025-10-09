import { AdminRole } from '@prisma/client';
import { AdminService } from './admin.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { TestModuleSingleton } from 'test/util/testModuleSingleTon';
import {
  CreateAdminBadRequestException,
  createAdminBadRequestExceptionMessages,
  CreateAdminConflictException,
} from './admin.exceptions';
import { ClientDto } from 'src/client/client.dto';

const CLIENT_MOCK_DATA = {
  name: 'Client Serv A',
  address: 'Client address in the client format.',
  phone: '+1-234-567-8900',
  ownerId: 'owner_123e4567',
};

const ADMIN_MOCK_DATA = [
  {
    name: 'Owner Admin A',
    email: 'owner_admin_a@email.com',
    passwordHash: 'hashed_password',
    role: AdminRole.CLIENT_OWNER,
  },
  {
    name: 'Owner Admin B',
    email: 'owner_admin_b@email.com',
    passwordHash: 'hashed_password',
    role: AdminRole.CLIENT_OWNER,
  },
  {
    name: 'Client Admin',
    email: 'client_admin_b@email.com',
    passwordHash: 'hashed_password',
    role: AdminRole.CLIENT_ADMIN,
  },
  {
    name: 'Unity Admin',
    email: 'unity_admin_a@email.com',
    passwordHash: 'hashed_password',
    role: AdminRole.UNITY_ADMIN,
    unityIds: ['unity_123e4567', 'unity_123e4568'],
  },
  {
    name: 'Queue Admin',
    email: 'queue_admin@email.com',
    passwordHash: 'hashed_password',
    role: AdminRole.QUEUE_ADMIN,
    queueIds: ['queue_123e4567', 'queue_123e4568'],
  },
];

describe('AdminService', () => {
  let adminService: AdminService;
  let prismaService: PrismaService;
  let clientData: ClientDto;

  beforeAll(async () => {
    const module = await TestModuleSingleton.createTestModule();
    adminService = module.get<AdminService>(AdminService);
    prismaService = module.get<PrismaService>(PrismaService);

    await TestModuleSingleton.cleanUpDatabase();

    const responseClient = await prismaService.client.create({
      data: CLIENT_MOCK_DATA,
    });

    clientData = {
      ...responseClient,
      address: responseClient.address ?? undefined,
      phone: responseClient.phone ?? undefined,
    };
  });

  it('should be defined', () => {
    expect(adminService).toBeDefined();
  });

  it('should NOT be able to create an admin with missing name', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { name, ...ownerAdminDataWithoutEmail } = ADMIN_MOCK_DATA[0];

    await expect(
      adminService.createAdmin({
        ...ownerAdminDataWithoutEmail,
        name: '',
        clientId: clientData.id,
      }),
    ).rejects.toThrow(
      new CreateAdminBadRequestException(
        createAdminBadRequestExceptionMessages.NAME_REQUIRED,
      ),
    );
  });

  it('should NOT be able to create an admin with missing email', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { email, ...ownerAdminDataWithoutEmail } = ADMIN_MOCK_DATA[0];

    await expect(
      adminService.createAdmin({
        ...ownerAdminDataWithoutEmail,
        email: '',
        clientId: clientData.id,
      }),
    ).rejects.toThrow(
      new CreateAdminBadRequestException(
        createAdminBadRequestExceptionMessages.EMAIL_REQUIRED,
      ),
    );
  });

  it('should NOT be able to create an admin with missing password', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...ownerAdminDataWithoutPassword } =
      ADMIN_MOCK_DATA[0];

    await expect(
      adminService.createAdmin({
        ...ownerAdminDataWithoutPassword,
        passwordHash: '',
        clientId: clientData.id,
      }),
    ).rejects.toThrow(
      new CreateAdminBadRequestException(
        createAdminBadRequestExceptionMessages.PASSWORD_REQUIRED,
      ),
    );
  });

  it('should NOT be able to create an admin with missing role', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { role, ...ownerAdminDataWithoutRole } = ADMIN_MOCK_DATA[0];

    await expect(
      adminService.createAdmin({
        ...ownerAdminDataWithoutRole,
        role: undefined as unknown as AdminRole, // Force to be undefined
        clientId: clientData.id,
      }),
    ).rejects.toThrow(
      new CreateAdminBadRequestException(
        createAdminBadRequestExceptionMessages.ROLE_REQUIRED,
      ),
    );
  });

  it('should NOT be able to create a Client Owner admin with missing clientId', async () => {
    const ownerAdminDataWithoutClientId = ADMIN_MOCK_DATA[0];

    await expect(
      adminService.createAdmin({
        ...ownerAdminDataWithoutClientId,
        clientId: undefined,
      }),
    ).rejects.toThrow(
      new CreateAdminBadRequestException(
        createAdminBadRequestExceptionMessages.CLIENT_ID_REQUIRED,
      ),
    );
  });

  it('should be able to create a Client Owner admin', async () => {
    const ownerAdminData = ADMIN_MOCK_DATA[0];

    const newOwnerAdmin = await adminService.createAdmin({
      ...ownerAdminData,
      clientId: clientData.id,
    });

    expect(newOwnerAdmin.id).toBeDefined();
    expect(newOwnerAdmin.name).toMatch(ownerAdminData.name);
    expect(newOwnerAdmin.email).toMatch(ownerAdminData.email);
    expect(newOwnerAdmin.role).toBe(AdminRole.CLIENT_OWNER);
    expect(newOwnerAdmin.clientId).toBe(clientData.id);
  });

  it('should NOT be able to create another Client Owner admin for the same client', async () => {
    const ownerAdminData = ADMIN_MOCK_DATA[1];

    await expect(
      adminService.createAdmin({
        ...ownerAdminData,
        clientId: clientData.id,
      }),
    ).rejects.toThrow(
      new CreateAdminConflictException(
        createAdminBadRequestExceptionMessages.OWNER_ALREADY_EXISTS,
      ),
    );
  });

  it('should be able to create a Client Admin', async () => {
    const clientAdminData = ADMIN_MOCK_DATA[2];

    const newClientAdmin = await adminService.createAdmin({
      ...clientAdminData,
      clientId: clientData.id,
    });

    expect(newClientAdmin.id).toBeDefined();
    expect(newClientAdmin.name).toMatch(clientAdminData.name);
    expect(newClientAdmin.email).toMatch(clientAdminData.email);
    expect(newClientAdmin.role).toBe(AdminRole.CLIENT_ADMIN);
    expect(newClientAdmin.clientId).toBe(clientData.id);
  });

  it('should NOT be able to create a Unity Admin with missing unityIds', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { unityIds, ...unityAdminDataWithoutUnityIds } = ADMIN_MOCK_DATA[3];

    await expect(
      adminService.createAdmin({
        ...unityAdminDataWithoutUnityIds,
        unityIds: [],
      }),
    ).rejects.toThrow(
      new CreateAdminBadRequestException(
        createAdminBadRequestExceptionMessages.UNITY_ID_REQUIRED,
      ),
    );
  });

  it('should be able to create a Unity Admin', async () => {
    const unityAdminData = ADMIN_MOCK_DATA[3];

    const newUnityAdmin = await adminService.createAdmin(unityAdminData);

    expect(newUnityAdmin.id).toBeDefined();
    expect(newUnityAdmin.name).toMatch(unityAdminData.name);
    expect(newUnityAdmin.email).toMatch(unityAdminData.email);
    expect(newUnityAdmin.role).toBe(AdminRole.UNITY_ADMIN);
    expect(newUnityAdmin.unityIds).toEqual(unityAdminData.unityIds);
  });

  it('should NOT be able to create a Queue Admin with missing queueIds', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { queueIds, ...queueAdminDataWithoutQueueIds } = ADMIN_MOCK_DATA[4];

    await expect(
      adminService.createAdmin({
        ...queueAdminDataWithoutQueueIds,
        queueIds: [],
      }),
    ).rejects.toThrow(
      new CreateAdminBadRequestException(
        createAdminBadRequestExceptionMessages.QUEUE_ID_REQUIRED,
      ),
    );
  });

  it('should be able to create a Queue Admin', async () => {
    const queueAdminData = ADMIN_MOCK_DATA[4];

    const newQueueAdmin = await adminService.createAdmin(queueAdminData);

    expect(newQueueAdmin.id).toBeDefined();
    expect(newQueueAdmin.name).toMatch(queueAdminData.name);
    expect(newQueueAdmin.email).toMatch(queueAdminData.email);
    expect(newQueueAdmin.role).toBe(AdminRole.QUEUE_ADMIN);
    expect(newQueueAdmin.queueIds).toEqual(queueAdminData.queueIds);
  });
});
