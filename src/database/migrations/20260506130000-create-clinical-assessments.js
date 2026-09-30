'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('clinical_assessments', {
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
      conditions: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: [],
      },
      allergies: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: [],
      },
      adl_scores: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {},
      },
      mobility: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '',
      },
      cognitive: {
        type: Sequelize.STRING,
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

    await queryInterface.addIndex('clinical_assessments', ['resident_id']);
    await queryInterface.addIndex('clinical_assessments', ['branch_id']);
    await queryInterface.addIndex('clinical_assessments', ['facility_id']);
    await queryInterface.addIndex('clinical_assessments', ['resident_id', 'createdAt']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('clinical_assessments');
  },
};

