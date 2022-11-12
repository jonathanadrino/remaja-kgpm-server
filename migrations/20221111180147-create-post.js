'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Posts', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING
      },
      highlight: {
        type: Sequelize.STRING
      },
      body: {
        type: Sequelize.STRING(1000)
      },
      imgUrl: {
        type: Sequelize.STRING(1000)
      },
      addedBy: {
        type: Sequelize.STRING
      },
      modifiedBy: {
        type: Sequelize.STRING
      },
      version: {
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Posts');
  }
};