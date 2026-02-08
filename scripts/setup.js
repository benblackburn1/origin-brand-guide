#!/usr/bin/env node

/**
 * Brand Hub Setup Script
 * Creates the first admin user for the application
 */

const readline = require('readline');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');

// Import User model
const User = require('../server/models/User');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
};

const setup = async () => {
  console.log('\n🚀 Brand Hub Setup\n');
  console.log('This script will help you create the first admin user.\n');

  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/brand-hub';
    console.log(`Connecting to MongoDB: ${mongoUri.replace(/\/\/.*@/, '//****@')}`);

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Check if users already exist
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log(`ℹ️  Found ${userCount} existing user(s) in the database.`);
      const proceed = await question('Do you want to create another admin user? (y/n): ');

      if (proceed.toLowerCase() !== 'y') {
        console.log('\nSetup cancelled.');
        process.exit(0);
      }
    }

    // Collect user information
    console.log('\nPlease enter the admin user details:\n');

    const username = await question('Username: ');
    if (!username || username.length < 3) {
      throw new Error('Username must be at least 3 characters');
    }

    const email = await question('Email: ');
    if (!email || !email.includes('@')) {
      throw new Error('Please enter a valid email address');
    }

    const password = await question('Password (min 6 characters): ');
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // Create admin user
    console.log('\nCreating admin user...');

    const user = await User.create({
      username,
      email: email.toLowerCase(),
      password,
      role: 'admin'
    });

    console.log('\n✅ Admin user created successfully!\n');
    console.log('User Details:');
    console.log(`  Username: ${user.username}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Role: ${user.role}`);
    console.log('\nYou can now login at http://localhost:3000/login\n');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);

    if (error.code === 11000) {
      console.error('A user with that username or email already exists.');
    }
  } finally {
    rl.close();
    await mongoose.connection.close();
    process.exit(0);
  }
};

setup();
