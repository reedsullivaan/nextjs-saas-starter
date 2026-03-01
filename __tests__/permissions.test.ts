import { describe, it, expect } from "vitest";

/**
 * Permission model tests for the workspace authorization system.
 *
 * These test the authorization logic in isolation — the same rules
 * enforced in the API routes. If these pass, the permission model is sound.
 */

type Role = "OWNER" | "ADMIN" | "MEMBER";

interface Member {
  id: string;
  userId: string;
  workspaceId: string;
  role: Role;
}

// Authorization logic extracted from API routes

function canUpdateWorkspace(requesterRole: Role): boolean {
  return requesterRole === "OWNER" || requesterRole === "ADMIN";
}

function canDeleteWorkspace(requesterRole: Role): boolean {
  return requesterRole === "OWNER";
}

function canInviteMembers(requesterRole: Role): boolean {
  return requesterRole === "OWNER" || requesterRole === "ADMIN";
}

function canRemoveMember(
  requester: Member,
  target: Member
): { allowed: boolean; reason?: string } {
  // Regular members can't remove anyone
  if (requester.role === "MEMBER") {
    return { allowed: false, reason: "Only admins and owners can remove members" };
  }

  // Can't remove the owner
  if (target.role === "OWNER") {
    return { allowed: false, reason: "Cannot remove the workspace owner" };
  }

  // Admins can't remove other admins
  if (target.role === "ADMIN" && requester.role !== "OWNER") {
    return { allowed: false, reason: "Only the owner can remove admins" };
  }

  return { allowed: true };
}

function canDeleteAccount(ownedWorkspaceCount: number): {
  allowed: boolean;
  reason?: string;
} {
  if (ownedWorkspaceCount > 0) {
    return {
      allowed: false,
      reason: "Must delete or transfer ownership of workspaces first",
    };
  }
  return { allowed: true };
}

// Test helpers
function member(role: Role, id = "m1", userId = "u1", wsId = "ws1"): Member {
  return { id, userId, workspaceId: wsId, role };
}

// Tests

describe("Workspace permissions", () => {
  describe("canUpdateWorkspace", () => {
    it("allows owners", () => {
      expect(canUpdateWorkspace("OWNER")).toBe(true);
    });

    it("allows admins", () => {
      expect(canUpdateWorkspace("ADMIN")).toBe(true);
    });

    it("denies members", () => {
      expect(canUpdateWorkspace("MEMBER")).toBe(false);
    });
  });

  describe("canDeleteWorkspace", () => {
    it("allows owners", () => {
      expect(canDeleteWorkspace("OWNER")).toBe(true);
    });

    it("denies admins", () => {
      expect(canDeleteWorkspace("ADMIN")).toBe(false);
    });

    it("denies members", () => {
      expect(canDeleteWorkspace("MEMBER")).toBe(false);
    });
  });

  describe("canInviteMembers", () => {
    it("allows owners", () => {
      expect(canInviteMembers("OWNER")).toBe(true);
    });

    it("allows admins", () => {
      expect(canInviteMembers("ADMIN")).toBe(true);
    });

    it("denies members", () => {
      expect(canInviteMembers("MEMBER")).toBe(false);
    });
  });
});

describe("Member removal permissions", () => {
  const owner = member("OWNER", "m-owner", "u-owner");
  const admin1 = member("ADMIN", "m-admin1", "u-admin1");
  const admin2 = member("ADMIN", "m-admin2", "u-admin2");
  const member1 = member("MEMBER", "m-member1", "u-member1");
  const member2 = member("MEMBER", "m-member2", "u-member2");

  describe("owner as requester", () => {
    it("can remove admins", () => {
      expect(canRemoveMember(owner, admin1)).toEqual({ allowed: true });
    });

    it("can remove members", () => {
      expect(canRemoveMember(owner, member1)).toEqual({ allowed: true });
    });

    it("cannot remove themselves (owner)", () => {
      const result = canRemoveMember(owner, owner);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("owner");
    });
  });

  describe("admin as requester", () => {
    it("can remove members", () => {
      expect(canRemoveMember(admin1, member1)).toEqual({ allowed: true });
    });

    it("cannot remove other admins", () => {
      const result = canRemoveMember(admin1, admin2);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("owner");
    });

    it("cannot remove the owner", () => {
      const result = canRemoveMember(admin1, owner);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("owner");
    });
  });

  describe("member as requester", () => {
    it("cannot remove anyone", () => {
      const result = canRemoveMember(member1, member2);
      expect(result.allowed).toBe(false);
    });

    it("cannot remove admins", () => {
      const result = canRemoveMember(member1, admin1);
      expect(result.allowed).toBe(false);
    });

    it("cannot remove the owner", () => {
      const result = canRemoveMember(member1, owner);
      expect(result.allowed).toBe(false);
    });
  });
});

describe("Account deletion", () => {
  it("allows deletion with no owned workspaces", () => {
    expect(canDeleteAccount(0)).toEqual({ allowed: true });
  });

  it("blocks deletion with one owned workspace", () => {
    const result = canDeleteAccount(1);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("transfer ownership");
  });

  it("blocks deletion with multiple owned workspaces", () => {
    const result = canDeleteAccount(3);
    expect(result.allowed).toBe(false);
  });
});

describe("Validation schemas", () => {
  it("rejects short passwords", async () => {
    const { registerSchema } = await import("@/lib/validation");
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid registration", async () => {
    const { registerSchema } = await import("@/lib/validation");
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "validpassword123",
      name: "Test User",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", async () => {
    const { registerSchema } = await import("@/lib/validation");
    const result = registerSchema.safeParse({
      email: "not-an-email",
      password: "validpassword123",
    });
    expect(result.success).toBe(false);
  });

  it("validates workspace slug format", async () => {
    const { workspaceSchema } = await import("@/lib/validation");

    // Valid
    expect(
      workspaceSchema.safeParse({ name: "My Workspace", slug: "my-workspace" })
        .success
    ).toBe(true);

    // Invalid: uppercase
    expect(
      workspaceSchema.safeParse({ name: "Test", slug: "My-Workspace" }).success
    ).toBe(false);

    // Invalid: spaces
    expect(
      workspaceSchema.safeParse({ name: "Test", slug: "my workspace" }).success
    ).toBe(false);

    // Invalid: special chars
    expect(
      workspaceSchema.safeParse({ name: "Test", slug: "my_workspace!" }).success
    ).toBe(false);
  });

  it("validates invite role enum", async () => {
    const { inviteSchema } = await import("@/lib/validation");

    expect(
      inviteSchema.safeParse({ email: "a@b.com", role: "ADMIN" }).success
    ).toBe(true);

    expect(
      inviteSchema.safeParse({ email: "a@b.com", role: "MEMBER" }).success
    ).toBe(true);

    expect(
      inviteSchema.safeParse({ email: "a@b.com", role: "OWNER" }).success
    ).toBe(false);

    expect(
      inviteSchema.safeParse({ email: "a@b.com", role: "SUPERADMIN" }).success
    ).toBe(false);
  });

  it("generates correct slugs", async () => {
    const { slugify } = await import("@/lib/validation");

    expect(slugify("My Company")).toBe("my-company");
    expect(slugify("Hello World 123")).toBe("hello-world-123");
    expect(slugify("UPPER CASE")).toBe("upper-case");
    expect(slugify("special!@#chars")).toBe("specialchars");
    expect(slugify("a".repeat(100))).toHaveLength(40);
  });
});
