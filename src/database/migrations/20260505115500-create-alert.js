'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Alert', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4,
      },
      facilityId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      branchId: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      residentId: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      severity: {
        type: Sequelize.ENUM('Info', 'Warning', 'Critical'),
        allowNull: false,
        defaultValue: 'Info',
      },
      status: {
        type: Sequelize.ENUM('Unread', 'Read', 'Resolved'),
        allowNull: false,
        defaultValue: 'Unread',
      },
      date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      targetRoles: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      healthState: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      sourceVitalId: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    await queryInterface.addIndex('Alert', ['facilityId']);
    await queryInterface.addIndex('Alert', ['branchId']);
    await queryInterface.addIndex('Alert', ['residentId']);
    await queryInterface.addIndex('Alert', ['sourceVitalId']);
    await queryInterface.addIndex('Alert', ['date']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Alert');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Alert_severity";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Alert_status";');
  },
};
