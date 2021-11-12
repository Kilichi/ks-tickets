let hastebin = require('hastebin');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (!interaction.isButton()) return;
    if (interaction.customId == "open-ticket") {
      if (client.guilds.cache.get(interaction.guildId).channels.cache.find(c => c.topic == interaction.user.id)) {
        return interaction.reply({
          content: `Ya tienes un ticket abierto!`,
          ephemeral: true
        });
      };

      interaction.guild.channels.create(`ticket-${interaction.user.username}`, {
        parent: client.config.opened_category,
        topic: interaction.user.id,
        permissionOverwrites: [{
            id: interaction.user.id,
            allow: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
          },
          {
            id: client.config.roleSupport,
            allow: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
          },
          {
            id: interaction.guild.roles.everyone,
            deny: ['VIEW_CHANNEL'],
          },
        ],
        type: 'text',
      }).then(async c => {
        interaction.reply({
          content: `Ticket Creado Correctamente! -> <#${c.id}>`,
          ephemeral: true
        });

        const embed = new client.discord.MessageEmbed()
          .setColor('0099E1')
          // .setAuthor('Ticket', 'https://i.imgur.com/oO5ZSRK.png')
          .setDescription(`
            **Tickets**
            select the category you want to go to 
          `)
          .setFooter('ks-shop', 'https://cdn.discordapp.com/attachments/908499648640065586/908501873542172762/logo-con-fondo-kilichi_1.png')
          .setTimestamp();

        const row = new client.discord.MessageActionRow()
          .addComponents(
            new client.discord.MessageSelectMenu()
            .setCustomId('category')
            .setPlaceholder('Select category')
            .addOptions([
              {
                label: 'Claim a Purchase',
                value: 'punchase',
                emoji: '💸',
              },
              {
                label: 'Get Support',
                value: 'support',
                emoji: '🔧',
              }
            ]),
          );

        msg = await c.send({
          content: `<@!${interaction.user.id}>`,
          embeds: [embed],
          components: [row]
        });

        const collector = msg.createMessageComponentCollector({
          componentType: 'SELECT_MENU',
          time: 20000
        });

        collector.on('collect', i => {
          if (i.user.id === interaction.user.id) {
            if (msg.deletable) {
              msg.delete().then(async () => {
                const embed = new client.discord.MessageEmbed()
                  .setColor('0099E1')
                  .setAuthor('Tickets')
                  .setDescription(`
                    Hello, <@!${interaction.user.id}>
                    your ticket is being reviewed by our team in charge,
                    thank you very much for trusting KS-SHOP
                  `)
                  .setFooter('ks-shop', 'https://cdn.discordapp.com/attachments/908499648640065586/908501873542172762/logo-con-fondo-kilichi_1.png')
                  .setTimestamp();

                const row = new client.discord.MessageActionRow()
                  .addComponents(
                    new client.discord.MessageButton()
                    .setCustomId('close-ticket')
                    .setLabel('Cerrar el ticket')
                    .setEmoji('899745362137477181')
                    .setStyle('DANGER'),
                  );

                const opened = await c.send({
                  content: `<@&${client.config.roleSupport}>`,
                  embeds: [embed],
                  components: [row]
                });

                opened.pin().then(() => {
                  opened.channel.bulkDelete(1);
                });
              });
            };
            // movimientos de ticket
            if (i.values[0] == 'punchase') {
              c.edit({
                parent: client.config.punchase_category
              });
            };

            if (i.values[0] == 'support') {
              c.edit({
                parent: client.config.support_category
              });
            };

          };
        });

        collector.on('end', collected => {
          if (collected.size < 1) {
            c.send(`Si no seleccionas la categoría el ticket se cerrará...`).then(() => {
              setTimeout(() => {
                if (c.deletable) {
                  c.delete();
                };
              }, 50000);
            });
          };
        });
      });
    };

    if (interaction.customId == "close-ticket") {
      const guild = client.guilds.cache.get(interaction.guildId);
      const chan = guild.channels.cache.get(interaction.channelId);

      const row = new client.discord.MessageActionRow()
        .addComponents(
          new client.discord.MessageButton()
          .setCustomId('confirm-close')
          .setLabel('Cerrar el ticket')
          .setStyle('DANGER'),
          new client.discord.MessageButton()
          .setCustomId('no')
          .setLabel('Cancelar')
          .setStyle('SECONDARY'),
        );

      const verif = await interaction.reply({
        content: '¿Estas seguro de que quieres cerrar el ticket?',
        components: [row]
      });

      const collector = interaction.channel.createMessageComponentCollector({
        componentType: 'BUTTON',
        time: 10000
      });

      collector.on('collect', i => {
        if (i.customId == 'confirm-close') {
          interaction.editReply({
            content: `Ticket fermé par <@!${interaction.user.id}>`,
            components: []
          });

          chan.edit({
              name: `closed-${chan.name}`,
              permissionOverwrites: [
                {
                  id: client.users.cache.get(chan.topic),
                  deny: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
                },
                {
                  id: client.config.roleSupport,
                  allow: ['SEND_MESSAGES', 'VIEW_CHANNEL'],
                },
                {
                  id: interaction.guild.roles.everyone,
                  deny: ['VIEW_CHANNEL'],
                },
              ],
            })
            .then(async () => {
              const embed = new client.discord.MessageEmbed()
                .setColor('0099E1')
                .setDescription('**Acciones de ticket**')
                .setFooter('ks-shop', 'https://cdn.discordapp.com/attachments/908499648640065586/908501873542172762/logo-con-fondo-kilichi_1.png')
                .setTimestamp();

              const row = new client.discord.MessageActionRow()
                .addComponents(
                  new client.discord.MessageButton()
                  .setCustomId('delete-ticket')
                  .setLabel('Borrar el ticket')
                  .setEmoji('🗑️')
                  .setStyle('DANGER'),
                );

              chan.send({
                embeds: [embed],
                components: [row]
              });
            });

          collector.stop();
        };
        if (i.customId == 'no') {
          interaction.editReply({
            content: 'El ticket no se cerrará!',
            components: []
          });
          collector.stop();
        };
      });

      collector.on('end', (i) => {
        if (i.size < 1) {
          interaction.editReply({
            content: 'El ticket no se cerrará!',
            components: []
          });
        };
      });
    };

    if (interaction.customId == "delete-ticket") {
      const guild = client.guilds.cache.get(interaction.guildId);
      const chan = guild.channels.cache.get(interaction.channelId);

      interaction.reply({
        content: 'Guardando los mensajes...'
      });

      chan.messages.fetch().then(async (messages) => {
        let a = messages.filter(m => m.author.bot !== true).map(m =>
          `${new Date(m.createdTimestamp).toLocaleString('es-ES')} - ${m.author.username}#${m.author.discriminator}: ${m.attachments.size > 0 ? m.attachments.first().proxyURL : m.content}`
        ).reverse().join('\n');
        if (a.length < 1) a = "Nothing"
        hastebin.createPaste(a, {
            contentType: 'html',
            server: 'https://www.toptal.com/developers/hastebin/documents'
          }, {})
          .then(function (urlToPaste) {
            const embed = new client.discord.MessageEmbed()
            .setDescription(`
              **Tickets**
              📰 Logs del ticket \`${chan.id} | ${chan.name}\`
              Creador :  <@!${chan.topic}>
              Moderador : <@!${interaction.user.id}>
              Logs: [**Link LOGS**](${urlToPaste})
            `)
            .setColor('2f3136')
            .setTimestamp();
            client.channels.cache.get(client.config.log_channel).send({
              embeds: [embed]
            });
            chan.send('Eliminando el canal...');

            setTimeout(() => {
              chan.delete();
            }, 5000);
          });
      });
    };
  },
};