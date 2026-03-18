package com.ecommerce.userservice.dto;

import com.ecommerce.userservice.entity.Role;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class UserResponse {
    private Long id;
    private String fullName;
    private String email;
    private String phoneNumber;
    private Role role;
    private LocalDateTime createdAt;
}