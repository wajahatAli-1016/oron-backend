'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('preferences', {
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
      sleep_pattern: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: '',
      },
      meal_pref: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: '',
      },
      communication: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: '',
      },
      social_pref: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: '',
      },
      family_engagement: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: '',
      },
      is_na: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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

    await queryInterface.addIndex('preferences', ['resident_id']);
    await queryInterface.addIndex('preferences', ['branch_id']);
    await queryInterface.addIndex('preferences', ['facility_id']);
    await queryInterface.addIndex('preferences', ['resident_id', 'createdAt']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('preferences');
  },
};

