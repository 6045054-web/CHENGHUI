
package com.chenghui.office.platform.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun LedgerScreen(user: User?) {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        OutlinedTextField(
            value = "",
            onValueChange = {},
            placeholder = { Text("搜索文书编号、日期...") },
            leadingIcon = { Icon(Icons.Default.Search, null) },
            modifier = Modifier.fillMaxWidth()
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(10) { index ->
                ListItem(
                    headlineContent = { Text("成汇报审表 #2024-00${index + 1}") },
                    supportingContent = { Text("状态：审核通过 | 提交人：张三") },
                    trailingContent = { Text("查看") }
                )
                HorizontalDivider()
            }
        }
    }
}
