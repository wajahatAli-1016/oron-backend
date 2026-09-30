'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('risk_profiles', {
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
      fall_risk_score: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      mobility_trend: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: '',
      },
      near_fall_events: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      vitals_trend: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: '',
      },
      narrative_interpretation: {
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

    await queryInterface.addIndex('risk_profiles', ['resident_id']);
    await queryInterface.addIndex('risk_profiles', ['branch_id']);
    await queryInterface.addIndex('risk_profiles', ['facility_id']);
    await queryInterface.addIndex('risk_profiles', ['resident_id', 'createdAt']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('risk_profiles');
  },
};

