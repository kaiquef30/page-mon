package io.github.pagemon.domain;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

public final class Hashing {
  private Hashing() {}

  public static String sha256Hex(String input) {
    try {
      MessageDigest messageDigest = MessageDigest.getInstance("SHA-256");
      byte[] dig = messageDigest.digest(input.getBytes(StandardCharsets.UTF_8));
      StringBuilder sb = new StringBuilder(dig.length * 2);
      for (byte b : dig) sb.append(String.format("%02x", b));
      return sb.toString();
    } catch (Exception e) {
      throw new IllegalStateException("Falha ao gerar SHA-256", e);
    }
  }
}
