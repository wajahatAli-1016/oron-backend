'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove plaintext medications column (replaced by medications_encrypted)
    await queryInterface.removeColumn('care_plans', 'medications');
  },

  async down(queryInterface, Sequelize) {
    // Restore old plaintext column for rollback (best-effort; data will be empty unless repopulated externally)
    await queryInterface.addColumn('care_plans', 'medications', {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: [],
    });
  },
};

