'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('care_plans', {
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
      generated_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      review_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      version: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      last_review_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      next_review_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      author: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      signed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      medications: {
        type: Sequelize.JSON,
        allowNull: false,
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

    await queryInterface.addIndex('care_plans', ['resident_id']);
    await queryInterface.addIndex('care_plans', ['branch_id']);
    await queryInterface.addIndex('care_plans', ['facility_id']);
    await queryInterface.addIndex('care_plans', ['generated_date']);
    await queryInterface.addIndex('care_plans', ['resident_id', 'generated_date']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('care_plans');
  },
};

