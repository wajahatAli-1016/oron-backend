'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('User', 'passwordSetTokenHash', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('User', 'passwordSetTokenExpiresAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('User', 'passwordSetTokenUsedAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addIndex('User', ['passwordSetTokenHash'], { unique: true });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('User', ['passwordSetTokenHash']);
    await queryInterface.removeColumn('User', 'passwordSetTokenUsedAt');
    await queryInterface.removeColumn('User', 'passwordSetTokenExpiresAt');
    await queryInterface.removeColumn('User', 'passwordSetTokenHash');
  },
};

