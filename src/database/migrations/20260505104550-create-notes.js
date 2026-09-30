'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notes', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4,
      },
      resident_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      author: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      type: {
        type: Sequelize.ENUM('Observation', 'Clinical', 'General'),
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

    // Add indexes
    await queryInterface.addIndex('notes', ['resident_id']);
    await queryInterface.addIndex('notes', ['timestamp']);
    await queryInterface.addIndex('notes', ['type']);
    await queryInterface.addIndex('notes', ['author']);
    await queryInterface.addIndex('notes', ['resident_id', 'timestamp']);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_notes_type";');
    await queryInterface.dropTable('notes');
  },
};