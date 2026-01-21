
package com.chenghui.office.platform.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun HomeScreen(user: User?) {
    LazyColumn(modifier = Modifier.fillMaxSize().padding(20.dp)) {
        item {
            Text("您好, ${user?.name ?: "用户"}", fontSize = 24.sp, fontWeight = FontWeight.Black)
            Text("欢迎使用成汇数字办公系统", fontSize = 12.sp, color = Color.Gray)
            
            Spacer(Modifier.height(24.dp))
            
            Card(
                modifier = Modifier.fillMaxWidth().height(150.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF2563EB))
            ) {
                Column(Modifier.padding(20.dp)) {
                    Text("当前派驻项目", color = Color.White.copy(alpha = 0.7f), fontSize = 12.sp)
                    Spacer(Modifier.height(8.dp))
                    Text("新疆成汇·数字监理总部", color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        item {
            Spacer(Modifier.height(24.dp))
            Text("待办事项", fontWeight = FontWeight.Bold, fontSize = 16.sp)
            Spacer(Modifier.height(12.dp))
        }

        items(3) { index ->
            ListItem(
                headlineContent = { Text("监理日志 - 待审核 #$index") },
                supportingContent = { Text("提交时间: 2024-05-20") },
                trailingContent = { Text("待办", color = Color(0xFFF59E0B), fontWeight = FontWeight.Bold) }
            )
            Divider()
        }
    }
}
