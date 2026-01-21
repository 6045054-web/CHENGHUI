
package com.chenghui.office.platform

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.navigation.compose.*
import com.chenghui.office.platform.ui.theme.ChenghuiTheme
import com.chenghui.office.platform.ui.screens.*

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            ChenghuiTheme {
                MainApp()
            }
        }
    }
}

sealed class Screen(val route: String, val title: String, val icon: ImageVector) {
    object Home : Screen("home", "首页", Icons.Default.Home)
    object FieldWork : Screen("field", "现场", Icons.Default.Build)
    object Ledger : Screen("ledger", "台账", Icons.Default.List)
    object Attendance : Screen("attendance", "打卡", Icons.Default.LocationOn)
    object Login : Screen("login", "登录", Icons.Default.Lock)
}

@Composable
fun MainApp() {
    val navController = rememberNavController()
    // 默认未登录状态
    var currentUser by remember { mutableStateOf<User?>(null) }
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    Scaffold(
        bottomBar = {
            // 只有登录后且不在登录页时显示底部导航栏
            if (currentUser != null && currentRoute != Screen.Login.route) {
                NavigationBar {
                    val items = listOf(Screen.Home, Screen.FieldWork, Screen.Ledger, Screen.Attendance)
                    items.forEach { screen ->
                        NavigationBarItem(
                            icon = { Icon(screen.icon, contentDescription = screen.title) },
                            label = { Text(screen.title) },
                            selected = currentRoute == screen.route,
                            onClick = {
                                navController.navigate(screen.route) {
                                    popUpTo(navController.graph.startDestinationId)
                                    launchSingleTop = true
                                }
                            }
                        )
                    }
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Screen.Login.route,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable(Screen.Login.route) {
                LoginScreen(onLoginSuccess = { user ->
                    currentUser = user
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                })
            }
            composable(Screen.Home.route) { HomeScreen(currentUser) }
            composable(Screen.FieldWork.route) { FieldWorkScreen(currentUser) }
            composable(Screen.Ledger.route) { LedgerScreen(currentUser) }
            composable(Screen.Attendance.route) { AttendanceScreen(currentUser) }
        }
    }
}
