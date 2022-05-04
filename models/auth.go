package models

import (
	crand "crypto/rand"
	"errors"
	"fmt"
	"github.com/golang-jwt/jwt"
	"math/rand"
	"time"
)

//该文件是我新加的

const tokenDuration = 2 * time.Hour

var (
	RandomString string
)

func RandAuthToken() string {
	buf := make([]byte, 32)
	_, err := crand.Read(buf)
	if err != nil {
		return RandString(64)
	}

	return fmt.Sprintf("%x", buf)
}

// 生成长度为length的随机字符串
func RandString(length int64) string {
	sources := []byte("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")
	var result []byte
	r := rand.New(rand.NewSource(time.Now().UnixNano()))
	sourceLength := len(sources)
	var i int64 = 0
	for ; i < length; i++ {
		result = append(result, sources[r.Intn(sourceLength)])
	}

	return string(result)
}

// 生成jwt
func GenerateToken(name string) (string, error) {
	token := jwt.New(jwt.SigningMethodHS256)
	claims := make(jwt.MapClaims)
	claims["exp"] = time.Now().Add(tokenDuration).Unix()
	claims["iat"] = time.Now().Unix()
	claims["username"] = name
	token.Claims = claims
	//fmt.Println(RandomString)

	return token.SignedString([]byte(RandomString))
}

// 还原jwt
func RestoreToken(authToken string) error {
	//fmt.Println(authToken)
	if authToken == "" {
		return nil
	}
	token, err := jwt.Parse(authToken, func(*jwt.Token) (interface{}, error) {
		//return []byte(RandomString), nil
		return []byte(RandomString), nil
	})
	if err != nil {
		return err
	}

	_, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return errors.New("invalid claims")
	}
	//fmt.Println(claims["username"])

	return nil
}
