'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.removeIndex('User', ['passwordSetTokenHash']);
    await queryInterface.renameColumn('User', 'passwordSetTokenHash', 'inviteToken');
    await queryInterface.renameColumn('User', 'passwordSetTokenExpiresAt', 'inviteExpires');
    await queryInterface.removeColumn('User', 'passwordSetTokenUsedAt');
    await queryInterface.addIndex('User', ['inviteToken'], { unique: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('User', ['inviteToken']);
    await queryInterface.renameColumn('User', 'inviteToken', 'passwordSetTokenHash');
    await queryInterface.renameColumn('User', 'inviteExpires', 'passwordSetTokenExpiresAt');
    await queryInterface.addColumn('User', 'passwordSetTokenUsedAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addIndex('User', ['passwordSetTokenHash'], { unique: true });
  },
};
