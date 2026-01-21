
package com.chenghui.office.platform.network

import com.chenghui.office.platform.ui.screens.*
import retrofit2.http.*

interface SupabaseApi {
    @GET("users")
    suspend fun login(
        @Query("username") username: String,
        @Query("password") password: String
    ): List<User>

    @GET("reports")
    suspend fun getReports(@Query("select") select: String = "*"): List<Report>

    @POST("reports")
    suspend fun saveReport(@Body report: Report)
}

interface GeminiApi {
    @POST("v1beta/models/gemini-pro:generateContent")
    suspend fun generateContent(
        @Query("key") apiKey: String,
        @Body request: GeminiRequest
    ): GeminiResponse
}

data class GeminiRequest(val contents: List<Content>)
data class Content(val parts: List<Part>)
data class Part(val text: String)
data class GeminiResponse(val candidates: List<Candidate>)
data class Candidate(val content: Content)
