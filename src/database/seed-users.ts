import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import { Role } from '../common/enums/role.enum';

async function seedUsers() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  try {
    const ownerEmail = 'owner@oron.com';
    const facilityAdminEmail = 'facilityadmin@oron.com';
    const branchAdminEmail = 'branchadmin@oron.com';
    const staffEmail = 'staff@oron.com';

    // Placeholder UUIDs for testing (in real app, these would come from actual facilities/branches)
    const testFacilityId = '550e8400-e29b-41d4-a716-446655440000';
    const testBranchId = '550e8400-e29b-41d4-a716-446655440001';

    const existingOwner = await usersService.findByEmail(ownerEmail);
    let owner = existingOwner;
    if (!existingOwner) {
      owner = await usersService.create({
        firstName: 'System',
        lastName: 'Owner',
        email: ownerEmail,
        password: 'owner123',
        role: Role.OWNER,
      });
      console.log('Owner user created:', ownerEmail, 'password: owner123');
    } else {
      console.log('Owner user already exists:', ownerEmail);
    }

    const existingFacilityAdmin = await usersService.findByEmail(facilityAdminEmail);
    let facilityAdmin = existingFacilityAdmin;
    if (!existingFacilityAdmin) {
      facilityAdmin = await usersService.create(
        {
          firstName: 'Facility',
          lastName: 'Admin',
          email: facilityAdminEmail,
          password: 'facility123',
          role: Role.FACILITY_ADMIN,
          facilityId: testFacilityId,
        },
        owner || undefined,
      );
      console.log('Facility admin user created:', facilityAdminEmail, 'password: facility123');
    } else {
      console.log('Facility admin user already exists:', facilityAdminEmail);
    }

    const existingBranchAdmin = await usersService.findByEmail(branchAdminEmail);
    let branchAdmin = existingBranchAdmin;
    if (!existingBranchAdmin) {
      branchAdmin = await usersService.create(
        {
          firstName: 'Branch',
          lastName: 'Admin',
          email: branchAdminEmail,
          password: 'branch123',
          role: Role.BRANCH_ADMIN,
          facilityId: testFacilityId,
          branchId: testBranchId,
        },
        facilityAdmin || undefined,
      );
      console.log('Branch admin user created:', branchAdminEmail, 'password: branch123');
    } else {
      console.log('Branch admin user already exists:', branchAdminEmail);
    }

    const existingStaff = await usersService.findByEmail(staffEmail);
    if (!existingStaff) {
      await usersService.create(
        {
          firstName: 'Staff',
          lastName: 'Member',
          email: staffEmail,
          password: 'staff123',
          role: Role.STAFF,
          facilityId: testFacilityId,
          branchId: testBranchId,
        },
        branchAdmin || undefined,
      );
      console.log('Staff user created:', staffEmail, 'password: staff123');
    } else {
      console.log('Staff user already exists:', staffEmail);
    }

    console.log('Seed complete. Test users are ready.');
  } catch (error) {
    console.error('Error seeding users:', error);
  } finally {
    await app.close();
  }
}

seedUsers();
