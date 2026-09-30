'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Vital', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4,
      },
      residentId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      branchId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      facilityId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      recordedById: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      systolicBP: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      diastolicBP: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      heartRate: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      temperature: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      oxygenSaturation: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      bloodSugar: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      weight: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      respiratoryRate: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      thresholdEvaluation: {
        type: Sequelize.JSON,
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
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Vital');
  },
};
