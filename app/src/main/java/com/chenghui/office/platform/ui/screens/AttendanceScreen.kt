
package com.chenghui.office.platform.ui.screens

import android.annotation.SuppressLint
import android.location.Location
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.google.android.gms.location.LocationServices
import androidx.compose.ui.platform.LocalContext
import com.google.accompanist.permissions.*

@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun AttendanceScreen(user: User?) {
    val context = LocalContext.current
    val fusedLocationClient = remember { LocationServices.getFusedLocationProviderClient(context) }
    val locationPermissionState = rememberPermissionState(android.Manifest.permission.ACCESS_FINE_LOCATION)
    
    var locationInfo by remember { mutableStateOf("点击按钮获取定位") }

    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text("当前工位：新疆成汇数字办公区", style = MaterialTheme.typography.titleLarge)
        Spacer(Modifier.height(32.dp))
        
        Text(locationInfo, style = MaterialTheme.typography.bodyMedium)
        
        Spacer(Modifier.height(32.dp))

        Button(
            onClick = {
                if (locationPermissionState.status.isGranted) {
                    fusedLocationClient.lastLocation.addOnSuccessListener { location: Location? ->
                        locationInfo = if (location != null) {
                            "经度: ${location.longitude}, 纬度: ${location.latitude}"
                        } else {
                            "定位失败，请确保 GPS 已开启"
                        }
                    }
                } else {
                    locationPermissionState.launchPermissionRequest()
                }
            },
            modifier = Modifier.fillMaxWidth().height(60.dp)
        ) {
            Text("立即签到")
        }
    }
}
