'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Posts', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      group: {
        type: Sequelize.STRING,
        defaultValue: 'project'
      },
      title: {
        type: Sequelize.STRING
      },
      cover: {
        type: Sequelize.STRING
      },
      data: {
        type: Sequelize.TEXT
      },
      description: {
        type: Sequelize.STRING
      },
      backgroundHex: {
        type: Sequelize.STRING,
        defaultValue: '#FFFFFF'
      },
      order: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      meta: {
        type: Sequelize.STRING,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: new Date()

      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: new Date()
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Posts');
  }
};