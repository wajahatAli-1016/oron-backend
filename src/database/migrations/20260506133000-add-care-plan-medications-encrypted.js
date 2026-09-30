'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('care_plans', 'medications_encrypted', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addIndex('care_plans', ['resident_id', 'createdAt']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('care_plans', ['resident_id', 'createdAt']);
    await queryInterface.removeColumn('care_plans', 'medications_encrypted');
  },
};

