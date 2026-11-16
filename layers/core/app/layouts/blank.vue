<template>
  <div class="relative flex min-h-svh flex-col bg-default">
    <div class="flex items-center justify-between gap-2 p-4">
      <AppLogo />
      <div class="flex items-center gap-1">
        <AppLocaleSwitcher />
        <AppColorModeButton />
      </div>
    </div>
    <main
      id="main-content"
      class="flex flex-1 items-center justify-center px-4 pb-10"
    >
      <slot />
    </main>
  </div>
</template>
