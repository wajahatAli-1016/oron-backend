'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('User', 'staffRole', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('User', 'staffStatus', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('User', 'lastActive', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('User', 'permissions', {
      type: Sequelize.JSON,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('User', 'permissions');
    await queryInterface.removeColumn('User', 'lastActive');
    await queryInterface.removeColumn('User', 'staffStatus');
    await queryInterface.removeColumn('User', 'staffRole');
  },
};
