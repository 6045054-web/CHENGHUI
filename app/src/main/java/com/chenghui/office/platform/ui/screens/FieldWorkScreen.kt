
package com.chenghui.office.platform.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp

@Composable
fun FieldWorkScreen(user: User?) {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("现场办公填报", style = MaterialTheme.typography.headlineSmall)
        Spacer(modifier = Modifier.height(16.dp))
        
        val menuItems = listOf(
            MenuAction("监理日志", Icons.Default.Edit),
            MenuAction("旁站记录", Icons.Default.Info),
            MenuAction("见证记录", Icons.Default.CheckCircle),
            MenuAction("监理通知", Icons.Default.Warning),
            MenuAction("巡视记录", Icons.Default.Search),
            MenuAction("重大事项", Icons.Default.Star)
        )

        LazyVerticalGrid(
            columns = GridCells.Fixed(2),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(menuItems) { item ->
                Card(
                    onClick = { /* 这里以后接表单页面 */ },
                    modifier = Modifier.height(120.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Column(
                        modifier = Modifier.fillMaxSize(),
                        verticalArrangement = Arrangement.Center,
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(item.icon, contentDescription = null, modifier = Modifier.size(32.dp))
                        Spacer(Modifier.height(8.dp))
                        Text(item.title, style = MaterialTheme.typography.labelLarge)
                    }
                }
            }
        }
    }
}

data class MenuAction(val title: String, val icon: ImageVector)
