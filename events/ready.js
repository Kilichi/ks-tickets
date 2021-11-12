module.exports = {
  name: 'ready',
  execute(client) {
    console.log('Ticket Bot ready!')
    const oniChan = client.channels.cache.get(client.config.embed_channel)

    function sendTicketMSG() {
      const embed = new client.discord.MessageEmbed()
        .setColor('0099E1')
        .setAuthor('Tickets', client.user.avatarURL())
        .setDescription(`
        **Purchase**
        Open ticket and select purchase option to claim your purchase or make it

        **Support**
        Open ticket and select support option to claim your service
        `)
        .setFooter('ks-shop', client.user.avatarURL())
        .setTimestamp()
        // .setDate()
      const row = new client.discord.MessageActionRow()
        .addComponents(
          new client.discord.MessageButton()
          .setCustomId('open-ticket')
          .setLabel('Open Ticket')
          .setEmoji('📩')
          .setStyle('SUCCESS')
        );

      oniChan.send({
        embeds: [embed],
        components: [row]
      })
    }

    oniChan.bulkDelete(100).then(() => {
      sendTicketMSG()
    })
  },
};