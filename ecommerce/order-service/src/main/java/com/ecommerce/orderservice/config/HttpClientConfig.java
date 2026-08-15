package com.ecommerce.orderservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.JdkClientHttpRequestFactory;

import java.net.http.HttpClient;

@Configuration
public class HttpClientConfig {

    /**
     * Java's HttpClient defaults to HTTP/2, which on cleartext calls sends an
     * h2c upgrade ("Connection: Upgrade, HTTP2-Settings"). uvicorn/h11 — used by
     * inventory-service — rejects that with "Invalid HTTP request received".
     * Pinning HTTP/1.1 keeps outbound calls compatible with every service.
     */
    @Bean
    public ClientHttpRequestFactory clientHttpRequestFactory() {
        return new JdkClientHttpRequestFactory(
                HttpClient.newBuilder()
                        .version(HttpClient.Version.HTTP_1_1)
                        .build());
    }
}
