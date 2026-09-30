'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('interventions', {
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
      responsible_staff_role: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: '',
      },
      frequency: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: '',
      },
      trigger_conditions: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: '',
      },
      effectiveness_metric: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: '',
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

    await queryInterface.addIndex('interventions', ['resident_id']);
    await queryInterface.addIndex('interventions', ['branch_id']);
    await queryInterface.addIndex('interventions', ['facility_id']);
    await queryInterface.addIndex('interventions', ['resident_id', 'createdAt']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('interventions');
  },
};

