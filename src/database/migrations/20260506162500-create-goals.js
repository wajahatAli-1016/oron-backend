'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('goals', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4,
      },
      resident_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      branch_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      facility_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: '',
      },
      target_metric: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: '',
      },
      timeframe: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '',
      },
      responsible_role: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '',
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'Active',
      },
      author: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      updated_by: {
        type: Sequelize.STRING,
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

    await queryInterface.addIndex('goals', ['resident_id']);
    await queryInterface.addIndex('goals', ['branch_id']);
    await queryInterface.addIndex('goals', ['facility_id']);
    await queryInterface.addIndex('goals', ['resident_id', 'createdAt']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('goals');
  },
};

