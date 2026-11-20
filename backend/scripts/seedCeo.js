import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import { ROLES, ACCOUNT_STATUS } from '../constants/roles.js';

dotenv.config();

const seedCEO = async () => {
  const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vector_advert_full_erp';
  
  try {
    console.log(`Connecting to MongoDB at: ${mongoURI}...`);
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB successfully.');

    const email = 'ceo@vector.com';
    const password = '12345678';
    const role = ROLES.CEO;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      console.log(`User with email '${email}' already exists. Updating password and role...`);
      user.password = password;
      user.roles = [role];
      user.accountStatus = ACCOUNT_STATUS.ACTIVE;
      user.mustChangePassword = false;
      user.isTemporaryPassword = false;
      await user.save();
      console.log(`User '${email}' updated successfully.`);
    } else {
      user = await User.create({
        email,
        password,
        roles: [role],
        accountStatus: ACCOUNT_STATUS.ACTIVE,
        mustChangePassword: false,
        isTemporaryPassword: false
      });
      console.log(`User '${email}' created successfully.`);
    }

    // Check or create Employee profile
    let employee = await Employee.findOne({ user: user._id });
    if (!employee) {
      employee = await Employee.findOne({ email });
    }

    if (!employee) {
      const existingEmpNum = await Employee.findOne({ employeeNumber: 'EMP-0001' });
      let empNum = 'EMP-0001';
      if (existingEmpNum) {
        const count = await Employee.countDocuments();
        empNum = `EMP-${String(count + 1).padStart(4, '0')}`;
      }

      employee = await Employee.create({
        employeeNumber: empNum,
        user: user._id,
        name: {
          first: 'CEO',
          last: 'Vector'
        },
        email: email,
        primaryPhone: '+251911000000',
        jobTitle: 'Chief Executive Officer',
        department: 'Executive Management',
        employmentType: 'full-time'
      });
      console.log(`Employee profile created for CEO: ${employee.name.first} ${employee.name.last} (${employee.employeeNumber}).`);
    } else {
      employee.user = user._id;
      employee.jobTitle = 'Chief Executive Officer';
      employee.department = 'Executive Management';
      await employee.save();
      console.log(`Employee profile '${employee.employeeNumber}' linked to user '${email}'.`);
    }

    console.log('\n=============================================');
    console.log('   DEFAULT CEO ACCOUNT PROVISIONED');
    console.log('=============================================');
    console.log(` Role:                ${role}`);
    console.log(` Name:                CEO Vector`);
    console.log(` Email:               ${email}`);
    console.log(` Password:            ${password}`);
    console.log(` Must Change Pwd:     false`);
    console.log(` Account Status:      active`);
    console.log('=============================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed CEO:', error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
};

seedCEO();
