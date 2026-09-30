'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('User', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      middleName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      role: {
        type: Sequelize.ENUM('OWNER', 'FACILITY_ADMIN', 'BRANCH_ADMIN', 'STAFF'),
        allowNull: false,
        defaultValue: 'STAFF',
      },
      facilityId: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      branchId: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    // Add indexes
    await queryInterface.addIndex('User', ['email'], {
      unique: true,
    });

    await queryInterface.addIndex('User', ['facilityId']);
    await queryInterface.addIndex('User', ['branchId']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('User');
  },
};