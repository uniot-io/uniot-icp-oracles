<template>
  <el-container class="full-height un-main-inner">
    <el-main class="un-empty-inner">
      <el-empty :image="collaboration" :image-size="300" description=" ">
        <el-text>
          We understand that each organization has unique needs.
          <br />
          If you or your organization has specific data visualization or interaction requirements,
          <br />
          we invite you to collaborate with us.
          <br />
          <br />
          Offer your custom template to customize the display of your data exactly as you envision it.
          <br />
          Contact our team to get started.
        </el-text>
      </el-empty>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import collaboration from '@/assets/collaboration.svg'
</script>