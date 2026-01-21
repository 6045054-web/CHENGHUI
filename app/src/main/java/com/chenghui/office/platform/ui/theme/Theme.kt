
package com.chenghui.office.platform.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = Blue600,
    secondary = Blue700,
    tertiary = Slate900
)

private val LightColorScheme = lightColorScheme(
    primary = Blue600,
    secondary = Blue700,
    tertiary = Color.White,
    background = Slate50
)

@Composable
fun ChenghuiTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
    MaterialTheme(
        colorScheme = colorScheme,
        content = content
    )
}
