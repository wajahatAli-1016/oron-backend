'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('care_plans', 'updated_by', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('care_plans', 'signed_by', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('care_plans', 'signed_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addIndex('care_plans', ['updated_by']);
    await queryInterface.addIndex('care_plans', ['signed']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('care_plans', ['signed']);
    await queryInterface.removeIndex('care_plans', ['updated_by']);

    await queryInterface.removeColumn('care_plans', 'signed_at');
    await queryInterface.removeColumn('care_plans', 'signed_by');
    await queryInterface.removeColumn('care_plans', 'updated_by');
  },
};

