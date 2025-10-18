import dotenv from "dotenv";
dotenv.config();

import {
  Client,
  GatewayIntentBits,
  Partials,
  SlashCommandBuilder,
  REST,
  Routes,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
  StringSelectMenuBuilder,
} from "discord.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Channel],
});

const token = process.env.DISCORD_TOKEN;
const staffRoleId = process.env.STAFF_ROLE_ID;
const WL_ID = process.env.WL_ID;
const WELCOME_CHANNEL_ID = process.env.WELCOME_CHANNEL_ID;

// Commands
const commands = [
  // Ticket button command
  new SlashCommandBuilder()
    .setName("ticketbutton")
    .setDescription("Create a ticket panel with up to 3 buttons")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(o => o.setName("color1").setDescription("Color for Button 1").setRequired(true))
    .addStringOption(o => o.setName("label1").setDescription("Label for Button 1").setRequired(false))
    .addStringOption(o => o.setName("emoji1").setDescription("Emoji for Button 1").setRequired(false))
    .addChannelOption(o => o.setName("category1").setDescription("Category for Button 1").addChannelTypes(ChannelType.GuildCategory).setRequired(false))
    .addStringOption(o => o.setName("color2").setDescription("Color for Button 2").setRequired(false))
    .addStringOption(o => o.setName("label2").setDescription("Label for Button 2").setRequired(false))
    .addStringOption(o => o.setName("emoji2").setDescription("Emoji for Button 2").setRequired(false))
    .addChannelOption(o => o.setName("category2").setDescription("Category for Button 2").addChannelTypes(ChannelType.GuildCategory).setRequired(false))
    .addStringOption(o => o.setName("color3").setDescription("Color for Button 3").setRequired(false))
    .addStringOption(o => o.setName("label3").setDescription("Label for Button 3").setRequired(false))
    .addStringOption(o => o.setName("emoji3").setDescription("Emoji for Button 3").setRequired(false))
    .addChannelOption(o => o.setName("category3").setDescription("Category for Button 3").addChannelTypes(ChannelType.GuildCategory).setRequired(false)),

  // Embed creation command
  new SlashCommandBuilder()
    .setName("createembed")
    .setDescription("Create a fully customized embed")
    .addStringOption(o => o.setName("color").setDescription("Hex code or color name").setRequired(true))
    .addStringOption(o => o.setName("title").setDescription("Embed title").setRequired(false))
    .addStringOption(o => o.setName("description").setDescription("Embed description").setRequired(false))
    .addStringOption(o => o.setName("footer").setDescription("Footer text").setRequired(false))
    .addStringOption(o => o.setName("footericon").setDescription("Footer icon URL").setRequired(false))
    .addBooleanOption(o => o.setName("timestamp").setDescription("Add timestamp").setRequired(false))
    .addStringOption(o => o.setName("thumbnail").setDescription("Thumbnail URL").setRequired(false))
    .addStringOption(o => o.setName("image").setDescription("Image URL").setRequired(false))
    .addStringOption(o => o.setName("authorname").setDescription("Author name").setRequired(false))
    .addStringOption(o => o.setName("authoricon").setDescription("Author icon URL").setRequired(false)),

  // Spacer command
  new SlashCommandBuilder()
    .setName("spacer")
    .setDescription("Add a spacer message to the channel")
    .addStringOption(o =>
      o.setName("length")
        .setDescription("Choose spacer length")
        .setRequired(true)
        .addChoices(
          { name: "Short", value: "short" },
          { name: "Long", value: "long" }
        )
    ),
  // Say command
  new SlashCommandBuilder()
    .setName("say")
    .setDescription("Send a message as the bot (admin only)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(o =>
      o.setName("message")
        .setDescription("Message to send")
        .setRequired(true)
    ),

  // Div command
  new SlashCommandBuilder()
    .setName("div")
    .setDescription("Send a preset embed with an image (admin only)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),


  // Waitlist command
  new SlashCommandBuilder()
    .setName("waitlist")
    .setDescription("Add a user to the waitlist with an order")
    .addUserOption(o =>
      o.setName("user")
        .setDescription("Customer being added")
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("item")
        .setDescription("Item ordered")
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("mop")
        .setDescription("Method of payment")
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("amount")
        .setDescription("Quantity ordered")
        .setRequired(true)
    ),

  // Prices command (admin-only)
  new SlashCommandBuilder()
    .setName("prices")
    .setDescription("Show pricing options dropdown")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
];

const rest = new REST({ version: "10" }).setToken(token);

client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  client.user.setPresence({
    status: "dnd",
    activities: [{ name: "my beautiful treasures", type: 3 }],
  });

  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log("Slash commands registered!");
  } catch (err) {
    console.error("Failed to register slash commands:", err);
  }
});

client.on("interactionCreate", async interaction => {
  try {
    const validStyles = {
      primary: ButtonStyle.Primary,
      secondary: ButtonStyle.Secondary,
      success: ButtonStyle.Success,
      danger: ButtonStyle.Danger,
    };
    if (interaction.isChatInputCommand() && interaction.commandName === "ticketbutton") {
      const buttons = [];

      for (let i = 1; i <= 3; i++) {
        const color = interaction.options.getString(`color${i}`);
        const label = interaction.options.getString(`label${i}`) || `Ticket ${i}`;
        const emoji = interaction.options.getString(`emoji${i}`);

        if (!color && i === 1) continue; // button 1 requires color
        if (color || label || emoji) {
          const style = validStyles[color?.toLowerCase()] || ButtonStyle.Primary;
          const button = new ButtonBuilder()
            .setCustomId(`ticket_create_${i}`)
            .setLabel(label)
            .setStyle(style);
          if (emoji) button.setEmoji(emoji);
          buttons.push(button);
        }
      }

      const row = new ActionRowBuilder().addComponents(buttons);

      await interaction.reply({ content: "✅ Ticket panel created!", ephemeral: true });
      await interaction.channel.send({
        content: "🎟️ **Click a button below to create a ticket:**",
        components: [row],
      });
    }

    // 🆕 Ticket creation
    else if (interaction.isButton() && interaction.customId.startsWith("ticket_create_")) {
      const existing = interaction.guild.channels.cache.find(
        c => c.name === `ticket-${interaction.user.username.toLowerCase()}`
      );
      if (existing)
        return interaction.reply({ content: "❌ You already have an open ticket!", ephemeral: true });

      const ticketChannel = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: 0, // GUILD_TEXT
        parent: categoryId,
        permissionOverwrites: [
          { id: interaction.guild.roles.everyone, deny: ["ViewChannel"] },
          { id: interaction.user.id, allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"] },
          { id: staffRoleId, allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"] },
        ],
      });

      const staffRole = interaction.guild.roles.cache.get(staffRoleId);

      const embed = new EmbedBuilder()
        .setTitle("🎟️ Support Ticket")
        .setDescription(
          `Hello ${interaction.user}, a staff member will assist you shortly.\n\nStaff ${staffRole} has been notified.`
        )
        .addFields(
          { name: "Opened by", value: `<@${interaction.user.id}>`, inline: true },
          { name: "Staff Role", value: `${staffRole}`, inline: true }
        )
        .setColor("Blue")
        .setTimestamp();

      const closeButton = new ButtonBuilder()
        .setCustomId("ticket_close")
        .setLabel("Close Ticket")
        .setStyle(ButtonStyle.Danger);

      const row = new ActionRowBuilder().addComponents(closeButton);

      await ticketChannel.send({ content: `${staffRole}`, embeds: [embed], components: [row] });
      await interaction.reply({ content: `✅ Ticket created: ${ticketChannel}`, ephemeral: true });
    }

    // 🗑️ Close ticket
    else if (interaction.isButton() && interaction.customId === "ticket_close") {
      if (!interaction.member.roles.cache.has(staffRoleId)) {
        return interaction.reply({
          content: "🚫 You don’t have permission to close this ticket.",
          ephemeral: true,
        });
      }

      await interaction.reply({ content: "🗑️ Closing ticket in 3 seconds...", ephemeral: true });
      setTimeout(() => interaction.channel.delete().catch(console.error), 3000);
    }
    // Spacer command
    else if (interaction.isChatInputCommand() && interaction.commandName === "spacer") {
      const length = interaction.options.getString("length");
      let spacer = "\u200B";
      if (length === "long") spacer = "\u200B\n".repeat(30);

      await interaction.channel.send(spacer);
      await interaction.reply({ content: `✅ ${length} spacer added!`, ephemeral: true });
    }
      // ✨ Create embed command
      else if (interaction.isChatInputCommand() && interaction.commandName === "createembed") {
        const embed = new EmbedBuilder();

        const title = interaction.options.getString("title");
        const description = interaction.options.getString("description");
        const color = interaction.options.getString("color");
        const footer = interaction.options.getString("footer");
        const footerIcon = interaction.options.getString("footericon");
        const timestamp = interaction.options.getBoolean("timestamp");
        const thumbnail = interaction.options.getString("thumbnail");
        const image = interaction.options.getString("image");
        const authorName = interaction.options.getString("authorname");
        const authorIcon = interaction.options.getString("authoricon");

        if (title) embed.setTitle(title);
        if (description) embed.setDescription(description);
        if (color) embed.setColor(color);
        if (footer) embed.setFooter({ text: footer, iconURL: footerIcon || null });
        if (timestamp) embed.setTimestamp();
        if (thumbnail) embed.setThumbnail(thumbnail);
        if (image) embed.setImage(image);
        if (authorName) embed.setAuthor({ name: authorName, iconURL: authorIcon || null });

        // Send the embed as a normal message in the channel
        await interaction.channel.send({ embeds: [embed] });

        // Optionally acknowledge the command so it doesn't show "interaction failed"
        await interaction.reply({ content: "✅ Embed sent!", ephemeral: true });
      }

    // Waitlist command
    else if (interaction.isChatInputCommand() && interaction.commandName === "waitlist") {
      if (!interaction.member.roles.cache.has(staffRoleId)) {
        return interaction.reply({
          content: "🚫 You do not have permission to use this command.",
          ephemeral: true,
        });
      }

      const wlChannel = interaction.guild.channels.cache.get(WL_ID);
      if (!wlChannel || !wlChannel.isTextBased()) {
        return interaction.reply({
          content: "❌ Waitlist channel not found or invalid.",
          ephemeral: true,
        });
      }

      const user = interaction.options.getUser("user");
      const item = interaction.options.getString("item");
      const mop = interaction.options.getString("mop");
      const amount = interaction.options.getString("amount");

      const orderText = `_ _\n_ _　　　♡ 　 ${user.username}'s order 　 .ᐟ\n　　_ _⠀⠀ ࣪⠀　${amount}x ${item}\n　　_ _ ⠀⠀ ࣪⠀　paid w: ${mop}\n　　_ _⠀⠀ ࣪⠀　status: pending\n-# 　　　　thank you for shopping with us!`;

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("status_paid").setLabel("paid").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("status_processing").setLabel("processing").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("status_done").setLabel("done").setStyle(ButtonStyle.Secondary)
      );

      await wlChannel.send({ content: orderText, components: [row] });
      await interaction.reply({ content: "✅ Order added to waitlist!", ephemeral: true });
    }

    // Update order status
    else if (interaction.isButton() && ["status_paid", "status_processing", "status_done"].includes(interaction.customId)) {
      if (!interaction.member.roles.cache.has(staffRoleId)) {
        return interaction.reply({
          content: "🚫 You do not have permission to update this status.",
          ephemeral: true,
        });
      }

      const statusMap = {
        status_paid: "paid",
        status_processing: "processing",
        status_done: "done",
      };

      const currentStatus = statusMap[interaction.customId];
      const updatedContent = interaction.message.content.replace(/status:\s*\w+/i, `status: ${currentStatus}`);

      let updatedComponents = interaction.message.components;

      if (currentStatus === "done") {
        updatedComponents = interaction.message.components.map(row => {
          const newRow = ActionRowBuilder.from(row);
          newRow.components = newRow.components.map(button => ButtonBuilder.from(button).setDisabled(true));
          return newRow;
        });
      }

      await interaction.message.edit({ content: updatedContent, components: updatedComponents });
      await interaction.reply({ content: `✅ Status updated to **${currentStatus}**.`, ephemeral: true });
    }
      // Div command (admin-only embed)
    else if (interaction.isChatInputCommand() && interaction.commandName === "div") {
      // Admin check
      if (!interaction.member.roles.cache.has(staffRoleId)) {
        return interaction.reply({ content: "🚫 You do not have permission.", ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setColor(0x36393f) // embed color
        .setImage("https://cdn.discordapp.com/attachments/1427657618008047621/1428616052152991744/ei_1760678820069-removebg-preview.png?ex=68f3cea1&is=68f27d21&hm=715e94744bb7c42a3289fc6dade894ba354d6b1cf0056b6a6ff0a6b83ef2da17");

      // Send the embed directly to the channel
      await interaction.channel.send({ embeds: [embed] });

      // Optional ephemeral confirmation
      await interaction.reply({ content: "✅ Embed sent!", ephemeral: true });
    }
        // Say command (admin-only)
        else if (interaction.isChatInputCommand() && interaction.commandName === "say") {
          if (!interaction.member.roles.cache.has(staffRoleId)) {
            return interaction.reply({ content: "🚫 You do not have permission.", ephemeral: true });
          }

          const message = interaction.options.getString("message");
          if (!message) {
            return interaction.reply({ content: "❌ You need to provide a message.", ephemeral: true });
          }

          await interaction.channel.send(message);
          await interaction.reply({ content: "✅ Message sent!", ephemeral: true });
        }

      // Prices dropdown command
      else if (interaction.isChatInputCommand() && interaction.commandName === "prices") {
        const row = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId("price_menu")
            .setPlaceholder(" 　　૮꒰ྀི ᴗ͈ . ᴗ͈ ∩꒱აྀི ˚ ⊹𓏼 payments ୧ ཾ ֪ | ͜͝ || ͜͝ |")
            .addOptions([
              { label: "⠀ ⠀ ⠀⁀➷ ⠀ ⠀ one ⠀﹒ ⠀c@shapp⠀⠀ྀིྀ", description: "ꈍ　　ㆍ　　✤　　⁺　　ㆍ　　ꈍ", value: "cashapp" },
              { label: "⠀ ⠀ ⠀⁀➷ ⠀ ⠀ two ⠀﹒ ⠀nitro ⠀⠀ྀིྀ", description: "ꈍ　　ㆍ　　✤　　⁺　　ㆍ　　ꈍ", value: "nitro" },
              { label: "⠀ ⠀ ⠀⁀➷ ⠀ ⠀ three⠀﹒ ⠀robux ⠀⠀ྀིྀ", description: "ꈍ　　ㆍ　　✤　　⁺　　ㆍ　　ꈍ", value: "robux" },
              { label: "⠀ ⠀ ⠀⁀➷ ⠀ ⠀ four ⠀﹒ ⠀add-ons ⠀⠀ྀིྀ", description: "ꈍ　　ㆍ　　✤　　⁺　　ㆍ　　ꈍ", value: "addons" },
            ])
        );

        // Send the dropdown publicly in the channel
        await interaction.channel.send({ components: [row] });
        // Notify the command user that the dropdown was sent
        await interaction.reply({ content: "✅ Dropdown sent!", ephemeral: true });
      }

      // Handle dropdown selection (ephemeral embeds)
      else if (interaction.isStringSelectMenu() && interaction.customId === "price_menu") {
        const color = "#36393f";
        let embed;

        switch (interaction.values[0]) {
          case "cashapp":
            embed = new EmbedBuilder()
              .setColor(color)
              .setDescription(`
      ticket command: $3
      complex ticket: $5
      waitlist: $1
      complex waitlist: $5
      embeds: $3 
      greet: $1
      complex greet: $3
      simple status: $1
      complex status: $3

-# any module not listed: negotiable

      interactive carrds
      maximal: $5
      minimal: $3
      $0.50 per page

      non-interactive carrds
      minimal: $1
      maximal: $3+

-# must have inspo or tut`);
            break;

          case "nitro":
            embed = new EmbedBuilder()
              .setColor(color)
              .setDescription(`
      ticket command: nbsc
      complex ticket: nbst (\*\ )
      waitlist: nbsc
      complex waitlist: nbst (\*\ )
      embeds: nbsc 
      greet: nbsc
      complex greet: nbsc
      simple status: nbsc
      complex status: deco (\*\ )

-# (\*\ ) - negotiable if bundled
-# any module not listed: negotiable

      interactive carrds
      maximal: nbst
      minimal: nbsc
      max: 3 pgs

      non-interactive carrds
      minimal: nbsc
      maximal: nbsc +

-# must have inspo or tut`);
            break;

          case "robux":
            embed = new EmbedBuilder()
              .setColor(color)
              .setDescription(`
      ticket command: 240 rbx
      complex ticket: 500 rbx
      waitlist: 100 rbx
      complex waitlist: 500 rbx
      embeds: 240 rbx 
      greet: 100 rbx
      complex greet: 240 rbx
      simple status: 100 rbx
      complex status: 240 rbx

-# any module not listed: negotiable

      interactive carrds
      maximal: 4–500 rbx
      minimal: 240 rbx
      80 rbx per page

      non-interactive carrds
      minimal: 100 rbx
      maximal: 240 rbx

-# must have inspo or tut`);
            break;

          case "addons":
            embed = new EmbedBuilder()
              .setColor(color)
              .setDescription(`
      rush fee: $5, 500 rbx, or dcr
      priority: $3, 240 rbx, or nbsc
      extra revisions: $1 after your 3rd
-# I will make you aware of the add-ons`);
            break;
        }

        // Send the embed ephemerally to the user
        await interaction.reply({
          embeds: [embed],
          ephemeral: true,
        });
      }
  } catch (err) {
    console.error(err);
  }
});

// Welcomer
client.on("guildMemberAdd", async member => {
  try {
    const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
    if (!channel || !channel.isTextBased()) return;

    const welcomeText = `_ _ ˚ ．𓉯ྀ⑅┊𓂅 w**e**__lco__m**e** ⁺⸺ ${member} ˚ִִ 𓏼 ͜͜✚ྀ⊹𓈒 ͜͝ | ͜͝ |\n⠀ ⠀ _ _`;

    const embed1 = new EmbedBuilder()
      .setColor(0x36393f)
      .setDescription(
        `⠀ ⠀ ⠀/ᐠ > . < ̥マ ݂۫ 𓏼 ₊ ͜ ◞ ྀིྀ\n⠀ ⠀ ꒰৯ ྐ✚ ₊　[tos](https://discord.com/channels/1427657617333026868/1428147471435038730)　+　[revw](https://discord.com/channels/1427657617333026868/1428394657762775191) ⠀ ♡︎ ༷݁ ꒱ྀ\n_ _　　꒷꒦ ͜ ¦𓏵 ᭪ [ask](https://discord.com/channels/1427657617333026868/1428392518168477747)｡ questions 𓏼 ͡ ⑅ ♡\n_ _　　　𓉸ྀི 𓂃˚ [exm](https://discord.com/channels/1427657617333026868/1428536539020918805) / [price](https://discord.com/channels/1427657617333026868/1428156228634411038) + [order](https://discord.com/channels/1427657617333026868/1428394803527290900) ྀི ͡ ̣̣̣ ׁ ︶`
      )
      .setImage("https://cdn.discordapp.com/attachments/1427657618008047621/1428616052152991744/ei_1760678820069-removebg-preview.png");

    const embed2 = new EmbedBuilder()
      .setColor(0x36393f)
      .setImage("https://cdn.discordapp.com/attachments/1427657618008047621/1428556895890968616/94927758da49e22d1584f9dd766d8345.jpg");

    await channel.send({ content: welcomeText, embeds: [embed1, embed2] });
  } catch (err) {
    console.error("Error in welcomer:", err);
  }
});

client.login(token);
