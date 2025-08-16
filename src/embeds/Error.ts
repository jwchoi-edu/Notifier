import CustomEmbed from '../structures/Embed'

export const Permission = {
  permissionFailed: () =>
    new CustomEmbed().setTitle('Permission Denied').setColor('Red'),

  notOwner: () =>
    Permission.permissionFailed().setDescription(
      'Only the bot owner can use this command.',
    ),
}
