
package com.chenghui.office.platform.ui.screens

enum class UserRole { ASSISTANT, ENGINEER, CHIEF, LEADER }

data class User(
    val id: String,
    val name: String,
    val username: String,
    val role: UserRole,
    val projectId: String? = null
)

data class Project(
    val id: String,
    val name: String,
    val location: String
)

data class Report(
    val id: String,
    val type: String,
    val authorName: String,
    val content: String,
    val date: String,
    val status: String
)

data class Announcement(
    val id: String,
    val title: String,
    val content: String,
    val publishDate: String
)
