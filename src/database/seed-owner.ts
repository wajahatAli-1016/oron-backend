import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import { Role } from '../common/enums/role.enum';
import * as bcrypt from 'bcrypt';

async function seedOwner() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  try {
    // Check if owner already exists
    const existingOwner = await usersService.findByEmail('owner@oron.com');

    if (existingOwner) {
      console.log('Owner user already exists');
      return;
    }

    // Create owner user
    await usersService.create({
      firstName: 'System',
      lastName: 'Owner',
      email: 'owner@oron.com',
      password: 'owner123',
      role: Role.OWNER,
    });

    console.log('Owner user created successfully');
    console.log('Email: owner@oron.com');
    console.log('Password: owner123');
  } catch (error) {
    console.error('Error seeding owner:', error);
  } finally {
    await app.close();
  }
}

seedOwner();